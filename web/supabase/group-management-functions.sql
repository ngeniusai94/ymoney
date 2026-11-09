-- 승인한 그룹 생성/참여/멤버 조회/나가기만 제공합니다.
-- public.tb_user와 auth.users는 읽기만 하며 기존 정책/함수는 변경하지 않습니다.
-- 비멤버 코드 조회와 여러 행의 원자적 변경에만 제한된 SECURITY DEFINER를 사용합니다.
-- 호출자 번호는 인자로 받지 않고 auth.uid()의 활성 M 프로필에서 결정합니다.
create function ymoney.fn_mon_create_group(p_group_name text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  caller_srno text;
  new_ledger_id bigint;
  attempt int;
begin
  select u.user_srno into caller_srno from public.tb_user u
  where u.user_uuid = auth.uid() and u.use_yn = 'Y' and u.user_srno ~ '^M[0-9]+$';
  if caller_srno is null then raise exception '회원정보를 확인하지 못했습니다.'; end if;
  if p_group_name is null or char_length(btrim(p_group_name)) not between 1 and 30 then
    raise exception '그룹 이름을 1~30자로 입력해주세요.';
  end if;
  -- 기존 UNIQUE(invite_code)로 충돌을 감지하고 새 랜덤 코드를 재시도합니다.
  for attempt in 1..5 loop
    insert into ymoney.tb_mon_ledger (ledger_type, ledger_name, invite_code, created_by_user_srno)
    values ('GROUP', btrim(p_group_name), upper(left(replace(gen_random_uuid()::text, '-', ''), 8)), caller_srno)
    on conflict (invite_code) do nothing returning ledger_id into new_ledger_id;
    exit when new_ledger_id is not null;
  end loop;
  if new_ledger_id is null then raise exception '초대 코드 생성에 실패했습니다. 다시 시도해주세요.'; end if;
  -- 멤버 저장 실패 시 가계부 INSERT도 같은 호출의 트랜잭션에서 취소됩니다.
  insert into ymoney.tb_mon_ledger_member (ledger_id, user_srno) values (new_ledger_id, caller_srno);
  return new_ledger_id;
end;
$$;

create function ymoney.fn_mon_join_group(p_invite_code text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  caller_srno text;
  target_ledger_id bigint;
begin
  select u.user_srno into caller_srno from public.tb_user u
  where u.user_uuid = auth.uid() and u.use_yn = 'Y' and u.user_srno ~ '^M[0-9]+$';
  if caller_srno is null then raise exception '회원정보를 확인하지 못했습니다.'; end if;
  if p_invite_code is null or upper(btrim(p_invite_code)) !~ '^[A-Z0-9]{8}$' then
    raise exception '영문·숫자 8자리 초대 코드를 입력해주세요.';
  end if;
  -- 동일 그룹의 참여/나가기가 이 행 잠금을 함께 사용하여 정원 경쟁을 막습니다.
  select l.ledger_id into target_ledger_id from ymoney.tb_mon_ledger l
  where l.ledger_type = 'GROUP' and l.invite_code = upper(btrim(p_invite_code)) for update;
  if target_ledger_id is null then raise exception '존재하지 않거나 무효인 초대 코드입니다.'; end if;
  if exists (select 1 from ymoney.tb_mon_ledger_member m where m.ledger_id = target_ledger_id and m.user_srno = caller_srno) then
    raise exception '이미 참여한 그룹입니다.';
  end if;
  if (select count(*) from ymoney.tb_mon_ledger_member m where m.ledger_id = target_ledger_id) >= 2 then
    raise exception '그룹 정원이 가득 찼습니다. 최대 2명까지 참여할 수 있습니다.';
  end if;
  insert into ymoney.tb_mon_ledger_member (ledger_id, user_srno) values (target_ledger_id, caller_srno);
  return target_ledger_id;
end;
$$;

-- 원문 이메일/UUID/회원번호는 반환하지 않습니다. 본인 여부와 표시 정보만 제공합니다.
create function ymoney.fn_mon_group_members(p_ledger_id bigint)
returns table (nickname text, masked_account text, is_self boolean)
language sql stable security definer set search_path = '' as $$
  select coalesce(u.nickname, ''),
    case when a.email is null or a.email = '' then ''
      else left(split_part(a.email, '@', 1), least(4, greatest(length(split_part(a.email, '@', 1)) - 1, 0))) || '****'
    end,
    u.user_uuid = auth.uid()
  from ymoney.tb_mon_ledger_member m
  join public.tb_user u on u.user_srno = m.user_srno
  left join auth.users a on a.id = u.user_uuid
  where m.ledger_id = p_ledger_id
    and exists (
      select 1 from ymoney.tb_mon_ledger l
      join ymoney.tb_mon_ledger_member mine on mine.ledger_id = l.ledger_id
      join public.tb_user caller on caller.user_srno = mine.user_srno
      where l.ledger_id = p_ledger_id and l.ledger_type = 'GROUP'
        and caller.user_uuid = auth.uid() and caller.use_yn = 'Y' and caller.user_srno ~ '^M[0-9]+$'
    )
  order by m.joined_at, m.user_srno;
$$;

create function ymoney.fn_mon_leave_group(p_ledger_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller_srno text;
  target_ledger_id bigint;
begin
  select u.user_srno into caller_srno from public.tb_user u
  where u.user_uuid = auth.uid() and u.use_yn = 'Y' and u.user_srno ~ '^M[0-9]+$';
  if caller_srno is null then raise exception '회원정보를 확인하지 못했습니다.'; end if;
  select l.ledger_id into target_ledger_id from ymoney.tb_mon_ledger l
  where l.ledger_id = p_ledger_id and l.ledger_type = 'GROUP' for update;
  if target_ledger_id is null then raise exception '접근할 수 있는 그룹이 없습니다.'; end if;
  if not exists (select 1 from ymoney.tb_mon_ledger_member m where m.ledger_id = p_ledger_id and m.user_srno = caller_srno) then
    raise exception '참여 중인 그룹이 아닙니다.';
  end if;
  delete from ymoney.tb_mon_ledger_member where ledger_id = p_ledger_id and user_srno = caller_srno;
  if not exists (select 1 from ymoney.tb_mon_ledger_member m where m.ledger_id = p_ledger_id) then
    -- 거래의 category/payment RESTRICT FK 때문에 참조하는 거래부터 명시적으로 삭제합니다.
    -- 해당 GROUP의 데이터만 삭제하며 PERSONAL/공용 사용자/다른 그룹은 유지합니다.
    delete from ymoney.tb_mon_transaction where ledger_id = p_ledger_id;
    delete from ymoney.tb_mon_category where ledger_id = p_ledger_id;
    delete from ymoney.tb_mon_category_group where ledger_id = p_ledger_id;
    delete from ymoney.tb_mon_payment_method where ledger_id = p_ledger_id;
    delete from ymoney.tb_mon_ledger where ledger_id = p_ledger_id;
  end if;
end;
$$;

-- 기본 PUBLIC 실행 권한은 즉시 회수하고 로그인 역할에만 좁은 API를 엽니다.
revoke all on function ymoney.fn_mon_create_group(text), ymoney.fn_mon_join_group(text),
  ymoney.fn_mon_group_members(bigint), ymoney.fn_mon_leave_group(bigint) from public, anon;
grant execute on function ymoney.fn_mon_create_group(text), ymoney.fn_mon_join_group(text),
  ymoney.fn_mon_group_members(bigint), ymoney.fn_mon_leave_group(bigint) to authenticated;
