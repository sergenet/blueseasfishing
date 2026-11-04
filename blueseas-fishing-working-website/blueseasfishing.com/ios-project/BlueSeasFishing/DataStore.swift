import Foundation

@MainActor
final class DataStore: ObservableObject {
    @Published var species: [Species] = []
    @Published var comparisons: [Comparison] = []
    @Published var destinations: [Destination] = []
    @Published var loaded = false

    private(set) var speciesBySlug: [String: Species] = [:]
    private(set) var speciesByDestination: [String: [Species]] = [:]
    private(set) var dataGenerated: String = ""

    /// Lowercased index terms per species (name, aliases, sci) for search.
    private var searchIndex: [String: String] = [:]

    init() {
        load()
    }

    func load() {
        let dec = JSONDecoder()
        if let f = Self.bundleFile("species.json") {
            species = (try? dec.decode(SpeciesFile.self, from: f))?.species ?? []
        }
        if let f = Self.bundleFile("comparisons.json") {
            comparisons = (try? dec.decode(ComparisonsFile.self, from: f))?.comparisons ?? []
        }
        if let f = Self.bundleFile("destinations.json") {
            destinations = (try? dec.decode(DestinationsFile.self, from: f))?.destinations ?? []
        }

        speciesBySlug = Dictionary(species.map { ($0.slug, $0) }, uniquingKeysWith: { a, _ in a })
        dataGenerated = Self.bundleFile("species.json").flatMap {
            try? JSONDecoder().decode(SpeciesFile.self, from: $0).generated
        } ?? ""

        var grouped: [String: [Species]] = [:]
        for d in destinations {
            grouped[d.slug] = d.species.compactMap { speciesBySlug[$0] }
        }
        speciesByDestination = grouped

        for s in species {
            var terms = [s.name.lowercased(), s.sci.lowercased()]
            terms += s.aliases.map { $0.lowercased() }
            searchIndex[s.slug] = terms.joined(separator: "\n")
        }
        loaded = true
    }

    /// Type-ahead search over common names, aliases and scientific names.
    /// Substring match on the raw query, then token-prefix boosting.
    func search(_ raw: String, limit: Int = 60) -> [Species] {
        let q = raw.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return [] }
        var scored: [(Species, Int)] = []
        for s in species {
            guard let hay = searchIndex[s.slug] else { continue }
            var score = -1
            if s.name.lowercased().hasPrefix(q) { score = 0 }
            else if hay.contains(q) { score = 1 }
            if score >= 0 { scored.append((s, score)) }
        }
        return scored.sorted { ($0.1, $0.0.name) < ($1.1, $1.0.name) }.prefix(limit).map { $0.0 }
    }

    func related(to s: Species, limit: Int = 6) -> [Species] {
        let key = Self.familyWord(s.name)
        var out: [Species] = []
        // Same family keyword first, then same-environment siblings.
        if !key.isEmpty {
            out += species.filter {
                $0.slug != s.slug && $0.name.lowercased().contains(key)
            }
        }
        out += species.filter {
            $0.slug != s.slug && $0.env == s.env && !out.contains($0)
        }
        return Array(out.prefix(limit))
    }

    func comparisons(for s: Species) -> [Comparison] {
        comparisons.filter { $0.a == s.name || $0.b == s.name }
    }

    /// Last meaningful word of a common name ("Largemouth Bass" -> "bass",
    /// "Rainbow Trout" -> "trout"). Only generic "fish" is dropped.
    static func familyWord(_ name: String) -> String {
        let stop = ["fish"]
        let words = name.lowercased().split { !$0.isLetter }
        guard let last = words.last else { return "" }
        let w = String(last)
        return stop.contains(w) ? "" : w
    }

    private static func bundleFile(_ name: String) -> Data? {
        guard let url = Bundle.main.url(forResource: name.replacingOccurrences(of: ".json", with: ""),
                                        withExtension: "json") else { return nil }
        return try? Data(contentsOf: url)
    }
}
