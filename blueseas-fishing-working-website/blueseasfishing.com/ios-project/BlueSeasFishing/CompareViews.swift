import SwiftUI

struct CompareListView: View {
    @EnvironmentObject var store: DataStore

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Side-by-side guides for the most commonly confused pairs.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .listRowBackground(Color.clear)
                }
                ForEach(store.comparisons) { c in
                    NavigationLink(value: c) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(c.title).fontWeight(.medium)
                            Text(c.env.isEmpty ? "\(c.rows.count) distinguishing features" : "\(c.env) · \(c.rows.count) features")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Compare")
            .navigationDestination(for: Comparison.self) { ComparisonDetailView(c: $0) }
        }
    }
}

struct ComparisonDetailView: View {
    let c: Comparison
    @EnvironmentObject var store: DataStore

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(c.title).font(.title2).bold()
                    if !c.lede.isEmpty { Text(c.lede).font(.subheadline).foregroundStyle(.secondary) }
                }
                .listRowBackground(Color.clear)
            }

            Section("How to tell them apart") {
                Grid(horizontalSpacing: 10, verticalSpacing: 12) {
                    GridRow {
                        Text("Feature").font(.caption).bold().foregroundStyle(.secondary)
                        Text(c.a).font(.caption).bold().foregroundStyle(Theme.fish)
                        Text(c.b).font(.caption).bold().foregroundStyle(Theme.fish)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(c.rows, id: \.feature) { r in
                        GridRow {
                            Text(r.feature).font(.caption).foregroundStyle(.secondary)
                            Text(r.a).font(.subheadline)
                            Text(r.b).font(.subheadline)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            ForEach([c.a, c.b], id: \.self) { name in
                if let s = store.speciesBySlug.first(where: { $0.value.name == name })?.value {
                    Section("Full profile — \(name)") {
                        NavigationLink(value: s) { SpeciesRow(s) }
                    }
                }
            }
        }
        .navigationTitle(c.a)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Species.self) { SpeciesDetailView(s: $0) }
    }
}
