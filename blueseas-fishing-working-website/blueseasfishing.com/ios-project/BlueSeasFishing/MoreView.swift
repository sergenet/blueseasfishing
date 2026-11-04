import SwiftUI

struct MoreView: View {
    @Environment(\.openURL) private var openURL

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Image("AppIconImage")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 72, height: 72)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        Text("Blue Seas Fishing")
                            .font(.title2).bold()
                        Text("548 fish species · 20 comparison guides · 124 destinations — in your pocket, offline.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 6)
                    .listRowBackground(Color.clear)
                }

                Section("Identify") {
                    Button {
                        openURL(URL(string: "https://www.blueseasfishing.com/fish-id.html")!)
                    } label: {
                        Label("Identify a fish photo (AI)", systemImage: "camera.viewfinder")
                    }
                    Button {
                        openURL(URL(string: "https://www.blueseasfishing.com/gallery.html")!)
                    } label: {
                        Label("Open the full species database", systemImage: "safari")
                    }
                }

                Section("On the web") {
                    Link(destination: URL(string: "https://www.blueseasfishing.com/privacy.html")!) {
                        Label("Privacy policy", systemImage: "hand.raised")
                    }
                    Link(destination: URL(string: "https://www.blueseasfishing.com/newsletter.html")!) {
                        Label("Monthly bite brief newsletter", systemImage: "envelope")
                    }
                }

                Section {
                    LabeledRow("Version", "1.0.0")
                } footer: {
                    Text("Species data bundled offline. Photos load from blueseasfishing.com when online. Always confirm identifications that affect possession limits with your local wildlife agency.")
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("More")
        }
    }
}
