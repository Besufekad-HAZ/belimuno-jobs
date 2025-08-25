export type ClientItem = {
  name: string;
  type?: string;
  service?: string;
};

// Central source of truth for client list (latest from company profile + legacy site)
export const CLIENTS: ClientItem[] = [
  {
    name: "World Food Programme (WFP)",
    type: "International NGO",
    service: "Cleaning crew warehouse handling",
  },
  {
    name: "Norwegian Refugee Council (NRC)",
    type: "International NGO",
    service: "Labor and construction professionals",
  },
  { name: "FHI360", type: "International NGO", service: "Security crew" },
  { name: "JHPIEGO", type: "International NGO", service: "Security crew" },
  {
    name: "Addis Guzo",
    type: "Local Business",
    service: "Security crew and cleaning",
  },
  {
    name: "Children Believe",
    type: "International NGO",
    service: "Cleaning services",
  },
  {
    name: "CICO",
    type: "Construction",
    service: "Labor and construction professionals",
  },
  {
    name: "VOITH",
    type: "International Company",
    service: "Labor and construction professionals",
  },
  {
    name: "DEC",
    type: "Construction",
    service: "Labor and construction professionals",
  },
  {
    name: "ALEC FITOUT",
    type: "Construction",
    service: "Labor and construction professionals",
  },
  {
    name: "KALPATARU",
    type: "Construction",
    service: "Labor and construction professionals",
  },
  {
    name: "CGGC (China Gezuba Group)",
    type: "Construction",
    service: "Fleet management professionals",
  },
];
