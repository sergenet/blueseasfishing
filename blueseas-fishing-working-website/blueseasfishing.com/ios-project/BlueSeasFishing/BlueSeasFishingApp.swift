import SwiftUI

@main
struct BlueSeasFishingApp: App {
    @StateObject private var store = DataStore()

    var body: some Scene {
        WindowGroup {
            TabView {
                SpeciesListView()
                    .tabItem { Label("Species", systemImage: "fish") }
                CompareListView()
                    .tabItem { Label("Compare", systemImage: "arrow.left.arrow.right") }
                DestinationsView()
                    .tabItem { Label("Destinations", systemImage: "map") }
                MoreView()
                    .tabItem { Label("More", systemImage: "ellipsis.circle") }
            }
            .environmentObject(store)
            .tint(Color("Accent"))
        }
    }
}
