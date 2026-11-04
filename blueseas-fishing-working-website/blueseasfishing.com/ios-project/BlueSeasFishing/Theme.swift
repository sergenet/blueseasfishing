import SwiftUI

enum Theme {
    static let ocean = Color(red: 11 / 255, green: 56 / 255, blue: 124 / 255)
    static let deep = Color(red: 6 / 255, green: 24 / 255, blue: 62 / 255)
    static let fish = Color(red: 255 / 255, green: 145 / 255, blue: 48 / 255)
}

/// Simple async image loader with an in-memory cache (no third-party deps).
struct SpeciesImage: View {
    let url: URL?

    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.ocean.opacity(0.14))
            if let image {
                Image(uiImage: image).resizable().scaledToFill()
            } else if failed {
                Image(systemName: "fish")
                    .font(.system(size: 34))
                    .foregroundStyle(Theme.ocean.opacity(0.5))
            } else {
                ProgressView()
            }
        }
        .task(id: url) { await load() }
    }

    private func load() async {
        guard let url else { failed = true; return }
        if let cached = ImageCache.shared[url] { image = cached; return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let img = UIImage(data: data) {
                ImageCache.shared[url] = img
                image = img
            } else { failed = true }
        } catch { failed = true }
    }
}

final class ImageCache {
    static let shared = ImageCache()
    private let cache = NSCache<NSURL, UIImage>()
    subscript(_ url: URL) -> UIImage? {
        get { cache.object(forKey: url as NSURL) }
        set { newValue == nil ? cache.removeObject(forKey: url as NSURL) : cache.setObject(newValue!, forKey: url as NSURL) }
    }
}
