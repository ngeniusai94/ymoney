import Foundation
import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        if let url = URL(string: "https://ymoney.vercel.app/") {
            YMoneyWebView(url: url)
                // 시스템 바 뒤까지 웹 배경을 펼치고 키보드의 안전 영역은 유지합니다.
                .ignoresSafeArea(.container, edges: [.top, .bottom])
        } else {
            Text("가계부 주소를 확인해주세요.")
        }
    }
}

// SwiftUI 화면 안에 UIKit 기반 WKWebView를 표시합니다.
private struct YMoneyWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // 시작 주소는 고정입니다. SwiftUI가 화면을 갱신해도 현재 웹 페이지를 다시 로드하지 않습니다.
    }
}
