import SwiftUI

struct DestinationsView: View {
    @EnvironmentObject var store: DataStore
    @State private var query = ""

    private var filtered: [Destination] {
        let q = query.lowercased()
        return q.isEmpty ? store.destinations : store.destinations.filter { $0.name.lowercased().contains(q) }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { d in
                NavigationLink {
                    DestinationDetailView(d)
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(d.name).fontWeight(.medium)
                        Text("\(d.count) species").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "124 destinations")
            .navigationTitle("Destinations")
        }
    }
}

struct DestinationDetailView: View {
    let d: Destination
    @EnvironmentObject var store: DataStore

    init(_ d: Destination) { self.d = d }

    private var list: [Species] {
        store.speciesByDestination[d.slug] ?? []
    }

    var body: some View {
        List {
            Section {
                Text("\(d.count) species in our database list \(d.name) as a fishery.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Section("Species found here") {
                ForEach(list) { s in
                    NavigationLink(value: s) { SpeciesRow(s) }
                }
            }
        }
        .navigationDestination(for: Species.self) { SpeciesDetailView(s: $0) }
        .navigationTitle(d.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
