export class FakeAddressStore {

    constructor() {
        this.addresses = [
            { street: "Arcusvägen", number: "95", zip: "97594", city: "Luleå", county: "Norrbotten", country: "Sweden" },
            { street: "Stationsgatan", number: "5", zip: "97238", city: "Luleå", county: "Norrbotten", country: "Sweden" },
            { street: "Aurorumvägen", number: "2", zip: "97775", city: "Luleå", county: "Norrbotten", country: "Sweden" },
            { street: "Södra Smedjegatan", number: "12", zip: "97235", city: "Luleå", county: "Norrbotten", country: "Sweden" },
            { street: "Banvägen", number: "3", zip: "97346", city: "Luleå", county: "Norrbotten", country: "Sweden" },
            { street: "Stortorget", number: "2", zip: "10316", city: "Stockholm", county: "Stockholms län", country: "Sweden" },
            { street: "Djurgårdsslätten", number: "49-51", zip: "11521", city: "Stockholm", county: "Stockholms län", country: "Sweden" },
            { street: "Eugeniavägen", number: "3", zip: "17164", city: "Solna", county: "Stockholms län", country: "Sweden" },
            { street: "Brinellvägen", number: "8", zip: "11428", city: "Stockholm", county: "Stockholms län", country: "Sweden" },
            { street: "Åsögatan", number: "117", zip: "11624", city: "Stockholm", county: "Stockholms län", country: "Sweden" }
        ];
    }

    load_for_county(value) {
        this.addresses = this.addresses.filter(function (el) {
            return el.county == value;
        });
        return this;
    }
}