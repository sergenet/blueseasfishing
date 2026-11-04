import SwiftUI

struct SpeciesListView: View {
    @EnvironmentObject var store: DataStore
    @State private var query = ""

    private var sections: [(String, [Species])] {
        let list = query.isEmpty ? store.species : store.search(query)
        let groups = Dictionary(grouping: list) { $0.letter }
        return groups.keys.sorted().map { ($0, groups[$0]!.sorted { $0.name < $1.name }) }
    }

    var body: some View {
        NavigationStack {
            List {
                if !query.isEmpty {
                    ForEach(sections.flatMap { $0.1 }) { s in
                        NavigationLink(value: s) { SpeciesRow(s) }
                    }
                } else {
                    ForEach(sections, id: \.0) { letter, list in
                        Section(letter) {
                            ForEach(list) { s in
                                NavigationLink(value: s) { SpeciesRow(s) }
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "548 species — name or scientific name")
            .navigationTitle("Species")
            .navigationDestination(for: Species.self) { SpeciesDetailView(s: $0) }
            .overlay {
                if store.species.isEmpty {
                    VStack(spacing: 10) {
                        ProgressView()
                        Text("Loading species database…")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

struct SpeciesRow: View {
    let s: Species
    init(_ s: Species) { self.s = s }

    var body: some View {
        HStack(spacing: 12) {
            SpeciesImage(url: s.imageURL)
                .frame(width: 56, height: 42)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(s.name).font(.headline)
                Text(s.env.isEmpty ? s.sci : "\(s.env) · \(s.sci)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 2)
    }
}

struct SpeciesDetailView: View {
    let s: Species
    @EnvironmentObject var store: DataStore
    @Environment(\.openURL) private var openURL

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(s.name).font(.largeTitle).bold()
                    Text(s.sci.isEmpty ? " " : s.sci)
                        .font(.subheadline).italic().foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .listRowBackground(Color.clear)

                SpeciesImage(url: s.imageURL)
                    .frame(height: 210)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .listRowBackground(Color.clear)
            }

            Section("Quick facts") {
                LabeledRow("Environment", s.env)
                LabeledRow("Season", s.season)
                if !s.depth.isEmpty { LabeledRow("Depth", s.depth) }
                if !s.aliases.isEmpty { LabeledRow("Also known as", s.aliases.joined(separator: ", ")) }
            }

            if !s.habitat.isEmpty {
                Section("Habitat & range") {
                    Text(s.habitat)
                }
            }

            if !s.regions.isEmpty {
                Section("Where to catch \(s.name)") {
                    ForEach(s.regions, id: \.self) { Text($0) }
                }
            }

            Section("Baits & lures") {
                if s.baits.isEmpty {
                    Text("Bait information for this species is being expanded.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(s.baits, id: \.self) { Text($0) }
                }
            }

            let comps = store.comparisons(for: s)
            if !comps.isEmpty {
                Section("Compare with look-alikes") {
                    ForEach(comps) { c in
                        NavigationLink(value: c) {
                            Text(c.title).fontWeight(.medium)
                        }
                    }
                }
            }

            let rel = store.related(to: s)
            if !rel.isEmpty {
                Section("Related species") {
                    ForEach(rel) { r in
                        NavigationLink(value: r) { SpeciesRow(r) }
                    }
                }
            }

            Section {
                Button {
                    openURL(URL(string: "https://www.blueseasfishing.com/fish-id.html")!)
                } label: {
                    Label("Identify a fish photo (AI)", systemImage: "camera.viewfinder")
                }
            } footer: {
                Text("Data: blueseasfishing.com · \(store.dataGenerated). Do not rely on a photo alone for legal or food-safety decisions — confirm with the responsible wildlife agency.")
            }
        }
        .navigationDestination(for: Comparison.self) { ComparisonDetailView(c: $0) }
    }
}

struct LabeledRow: View {
    let label: String
    let value: String
    init(_ label: String, _ value: String) {
        self.label = label
        self.value = value.isEmpty ? "—" : value
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.caption2).bold()
                .foregroundStyle(Theme.ocean)
            Text(value).font(.subheadline)
        }
        .padding(.vertical, 2)
    }
}
