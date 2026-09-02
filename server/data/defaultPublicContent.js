const clients = [
  {
    name: "The HALO Trust",
    type: "International NGO",
    service: "Humanitarian mine action support",
    logo: "/clients/editted/halo-trust.jpg",
    brandColor: "#133b63",
  },
  {
    name: "DanChurchAid (DCA)",
    type: "International NGO",
    service: "Labour outsourcing & emergency response",
    logo: "/clients/editted/dca.jpg",
    brandColor: "#E10600",
  },
  {
    name: "Action Against Hunger",
    type: "International NGO",
    service: "Nutrition and field staffing",
    logo: "/clients/editted/action-against-hunger.jpg",
    brandColor: "#1576D6",
  },
  {
    name: "Alive & Thrive",
    type: "International NGO",
    service: "Maternal and child nutrition programmes",
    logo: "/clients/editted/alive-and-thrive.webp",
    brandColor: "#111111",
  },
  {
    name: "Addis Guzo",
    type: "Local NGO",
    service: "Security crew and cleaning",
    logo: "/clients/editted/addis-guzo.png",
    brandColor: "#D4A019",
  },
  {
    name: "CGGC (China Gezuba Group)",
    type: "Construction",
    service: "Fleet management professionals",
    logo: "/clients/editted/cggc.png",
    brandColor: "#1F4EA3",
  },
  {
    name: "Children Believe",
    type: "International NGO",
    service: "Community programmes support",
    logo: "/clients/editted/children-believe.png",
    brandColor: "#82368C",
  },
  {
    name: "FHI360",
    type: "International NGO",
    service: "Security crew and programme support",
    logo: "/clients/editted/fhi360.png",
    brandColor: "#F58220",
  },
  {
    name: "International IDEA",
    type: "Intergovernmental Organisation",
    service: "Electoral assistance and governance support",
    logo: "/clients/editted/international-idea.png",
    brandColor: "#1C4C9A",
  },
  {
    name: "The Lutheran World Federation",
    type: "Faith-based NGO",
    service: "Operations & support staff",
    logo: "/clients/editted/lutheran-world-federation.png",
    brandColor: "#3B82F6",
  },
  {
    name: "Oxfam",
    type: "International NGO",
    service: "Field support and logistics",
    logo: "/clients/editted/oxfam.png",
    brandColor: "#76B72A",
  },
  {
    name: "Trablisa",
    type: "Security Company",
    service: "Security personnel",
    logo: "/clients/editted/trablisa.jpg",
    brandColor: "#102A5F",
  },
  {
    name: "Stantec",
    type: "Engineering & Design",
    service: "Technical talent sourcing",
    logo: "/clients/editted/stantec.png",
    brandColor: "#F97316",
  },
  {
    name: "Unimpresa",
    type: "Business Association",
    service: "International staffing partner",
    logo: "/clients/editted/unimpresa.jpg",
    brandColor: "#1F3C88",
  },
  {
    name: "Voith",
    type: "International Company",
    service: "Industrial workforce solutions",
    logo: "/clients/editted/voith.jpg",
    brandColor: "#0F2F8C",
  },
  {
    name: "Jhpiego",
    type: "International NGO",
    service: "Healthcare workforce deployment",
    logo: "/clients/editted/jhpiego.png",
    brandColor: "#0D6F7C",
  },
];

const services = [
  {
    title: "Manpower Supply",
    description:
      "Professional and non-professional staffing with a deep candidate network and rigorous vetting.",
  },
  {
    title: "Manpower Outsourcing",
    description:
      "End-to-end outsourcing of cleaners, security guards, construction and fleet crews, with supervision.",
  },
  {
    title: "Recruitment for Employers",
    description:
      "Targeted hiring campaigns, assessments and onboarding coordination for local and international firms.",
  },
  {
    title: "HR Consultancy",
    description:
      "Policies, org design, compensation reviews, performance systems and compliance advisory.",
  },
  {
    title: "Training & Development",
    description:
      "Soft skills and technical trainings for security, cleaning, HSE, site operations and customer service.",
  },
  {
    title: "Project-based Crews",
    description:
      "Rapid mobilization of skilled labor for construction, logistics and facilities management projects.",
  },
];

const news = [
  {
    title: "Annual Company Meeting & Employee Recognition",
    excerpt:
      "We are delighted to share our 2017 EC Annual Company Meeting, where we came together to celebrate our achievements, share future plans, and honor the dedicated people behind our success.",
    content: `
      <h2>Annual Company Meeting & Employee Recognition</h2>
      <p>We are delighted to share our 2017 EC Annual Company Meeting.</p>
      <ul>
        <li>Date: September 18, 2025</li>
        <li>Venue: Menanda Hotel, Bishoftu</li>
        <li>Time: 11:00 AM</li>
      </ul>
      <p>The event brought the team together to reflect on milestones, discuss future plans, and celebrate employees who have served with outstanding commitment.</p>
    `,
    date: new Date("2024-01-15"),
    category: "Company News",
    image: "/news/news1.jpg",
    readTime: "5 min read",
    author: "Belimuno Team",
    status: "published",
  },
  {
    title: "BELIMUNO Wins DEC Contract for Tekeze Project",
    excerpt:
      "BELIMUNO HR Outsourcing Solution has been awarded a manpower outsourcing contract by DEC for the maintenance of the Tekeze Hydroelectrical Project.",
    content: `
      <p>We are thrilled to announce that BELIMUNO HR Outsourcing Solution has been awarded a manpower outsourcing contract by DEC for the maintenance of the Tekeze Hydroelectrical Project.</p>
      <p>This achievement reflects the hard work of our team and the trust placed in us by our partners.</p>
    `,
    date: new Date("2024-06-10"),
    category: "Company News",
    image: "/news/news2.jpg",
    readTime: "1 min read",
    author: "Belimuno Team",
    status: "published",
  },
  {
    title: "Congratulations to Our Dedicated Team",
    excerpt:
      "The renovation of Africa Hall in Addis Ababa marked a major milestone, and we are proud of our team's contribution to this important project.",
    content: `
      <h2>Congratulations to Our Dedicated Team</h2>
      <p>The United Nations Economic Commission for Africa completed the renovation of the historic Africa Hall in Addis Ababa, Ethiopia.</p>
      <p>We extend our congratulations to the Belimuno HR Outsourcing Solution team for contributing expertise and support to this landmark project.</p>
    `,
    date: new Date("2024-10-21"),
    category: "Company News",
    image: "/news/news3.jpg",
    readTime: "6 min read",
    author: "Belimuno Team",
    status: "published",
  },
];

const trustedCompanies = clients.map((client, index) => ({
  name: client.name,
  status: "active",
  order: index + 1,
  brandColor: client.brandColor,
  description: client.service,
  logo: client.logo,
  logoAlt: `${client.name} logo`,
  tags: [client.type, client.service].filter(Boolean),
}));

module.exports = {
  clients,
  services,
  news,
  trustedCompanies,
};
