export type ClientItem = {
  name: string;
  type?: string;
  service?: string;
  /** Optional path to the client logo (relative to /public). */
  logo?: string;
  /** Optional hex color used to tint placeholders while waiting for assets. */
  brandColor?: string;
};

// Central source of truth for client list (latest from company profile + legacy site)
export const CLIENTS: ClientItem[] = [
  {
    name: "The HALO Trust",
    type: "International NGO",
    service: "Humanitarian mine action support",
    logo: "/clients/halo-trust.jpg",
    brandColor: "#133b63",
  },
  {
    name: "DanChurchAid (DCA)",
    type: "International NGO",
    service: "Labour outsourcing & emergency response",
    logo: "/clients/dca.jpg",
    brandColor: "#E10600",
  },
  {
    name: "Action Against Hunger",
    type: "International NGO",
    service: "Nutrition and field staffing",
    logo: "/clients/action-against-hunger.jpg",
    brandColor: "#1576D6",
  },
  {
    name: "Alive & Thrive",
    type: "International NGO",
    service: "Maternal and child nutrition programmes",
    logo: "/clients/alive-and-thrive.webp",
    brandColor: "#111111",
  },
  {
    name: "Addis Guzo",
    type: "Local NGO",
    service: "Security crew and cleaning",
    logo: "/clients/addis-guzo.png",
    brandColor: "#D4A019",
  },
  {
    name: "CGGC (China Gezuba Group)",
    type: "Construction",
    service: "Fleet management professionals",
    logo: "/clients/cggc.png",
    brandColor: "#1F4EA3",
  },
  {
    name: "Children Believe",
    type: "International NGO",
    service: "Community programmes support",
    logo: "/clients/children-believe.png",
    brandColor: "#82368C",
  },
  {
    name: "FHI360",
    type: "International NGO",
    service: "Security crew and programme support",
    logo: "/clients/fhi360.png",
    brandColor: "#F58220",
  },
  {
    name: "International IDEA",
    type: "Intergovernmental Organisation",
    service: "Electoral assistance and governance support",
    logo: "/clients/international-idea.png",
    brandColor: "#1C4C9A",
  },
  {
    name: "The Lutheran World Federation",
    type: "Faith-based NGO",
    service: "Operations & support staff",
    logo: "/clients/lutheran-world-federation.png",
    brandColor: "#3B82F6",
  },
  {
    name: "Oxfam",
    type: "International NGO",
    service: "Field support and logistics",
    logo: "/clients/oxfam.png",
    brandColor: "#76B72A",
  },
  {
    name: "Trablisa",
    type: "Security Company",
    service: "Security personnel",
    logo: "/clients/trablisa.jpg",
    brandColor: "#102A5F",
  },
  {
    name: "Stantec",
    type: "Engineering & Design",
    service: "Technical talent sourcing",
    logo: "/clients/stantec.png",
    brandColor: "#F97316",
  },
  {
    name: "Unimpresa",
    type: "Business Association",
    service: "International staffing partner",
    logo: "/clients/unimpresa.jpg",
    brandColor: "#1F3C88",
  },
  {
    name: "Voith",
    type: "International Company",
    service: "Industrial workforce solutions",
    logo: "/clients/voith.jpg",
    brandColor: "#0F2F8C",
  },
  {
    name: "Jhpiego",
    type: "International NGO",
    service: "Healthcare workforce deployment",
    logo: "/clients/jhpiego.png",
    brandColor: "#0D6F7C",
  },
];
