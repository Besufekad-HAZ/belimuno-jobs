export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  imageUrl?: string;
  readTime?: string;
  author?: string;
}

export const newsData: NewsItem[] = [
  {
    id: "1",
    title: "Annual Company Meeting & Employee Recognition",
    excerpt:
      "We are delighted to had our 2017 EC Annual Company Meeting, where we came together to celebrate our collective achievements, share future plans, and honor the dedicated individuals who make our success possible.",
    content: `
      <h2>Annual Company Meeting & Employee Recognition</h2>
      <p>We are delighted to had our 2017 EC Annual Company Meeting,</p>
      <ul>
        <li>📅 Date: September 18th 2025</li>
        <li>📍 Venue: in Bisheftu, MENANDA HOTEL</li>
        <li>🕒 Time: at 11 am</li>
      </ul>
      <p>
        where we came together to celebrate our collective achievements, share future plans, and honor the dedicated individuals who make our success possible.
      </p>
      <h3>✨ Event Highlights:</h3>
      <ul>
        <li>Annual Meeting: Reflection on milestones, growth, and upcoming goals.</li>
        <li>Long Service Recognition: Special appreciation for employees who have dedicated more than 10 years of outstanding service to our company.</li>
        <li>Employee of the Year Award: Honoring the team member whose exceptional performance, commitment, and values have set an inspiring example for us all.</li>
      </ul>
      <p>
        This event is not only a time to review our progress but also to celebrate the people who are at the heart of everything we do.
      </p>
    `,
    date: "2024-01-15",
    category: "Company News",
    imageUrl: "/news/news1.jpg",
    readTime: "5 min read",
    author: "Belimuno Team",
  },
  {
    id: "2",
    title: "BELIMUNO Wins DEC Contract for Tekeze Project",
    excerpt:
      "📢 Exciting News! BELIMUNO HR OUTSOURCING SOLUTION has been awarded a manpower outsourcing contract by DEC for the maintenance of Tekeze Hydroelectrical Project. This achievement highlights our team's hard work and the trust placed in us.",
    content: `
      <p>📢 <strong>Exciting News!</strong></p>
      <p>We’re thrilled to announce that <strong>BELIMUNO HR OUTSOURCING SOLUTION</strong> has been awarded a manpower outsourcing contract by DEC for the maintenance of <strong>Tekeze Hydroelectrical Project</strong> ⚡💧</p>
      <p>This achievement highlights the hard work of our team and the trust placed in us. We’re eager to bring our expertise and commitment to excellence to this project.</p>
    `,
    date: "2024-06-10",
    category: "Company News",
    imageUrl: "/news/news2.jpg",
    readTime: "1 min read",
    author: "Belimuno Team",
  },
  {
    id: "3",
    title: "Congratulations to Our Dedicated Team",
    excerpt:
      "The United Nations Economic Commission for Africa (UNECA) has successfully completed the renovation of the historic Africa Hall in Addis Ababa, Ethiopia, marking a significant milestone in preserving African heritage and promoting unity. This project, which cost approximately $57 million, aimed to modernize the facility while honoring its rich history as the birthplace of the Organization of African Unity (OAU) in 1963.",
    content: `
      <h2>Congratulations to Our Dedicated Team</h2>
      <p>
        The United Nations Economic Commission for Africa (UNECA) has successfully completed the renovation of the historic Africa Hall in Addis Ababa, Ethiopia, marking a significant milestone in preserving African heritage and promoting unity. This project, which cost approximately $57 million, aimed to modernize the facility while honoring its rich history as the birthplace of the Organization of African Unity (OAU) in 1963.
      </p>
      <p>
        The Africa Hall has long been a symbol of African history and culture, hosting numerous pivotal events in the continent's quest for unity and independence. The renovation included structural upgrades to enhance safety and accessibility, as well as the addition of modern conference facilities that meet international standards. A permanent exhibition will also be established to showcase the hall's architectural significance and its role in pan-Africanism.
      </p>
      <p>
        We would like to extend our heartfelt congratulations to our dedicated team at Belimuno HR Outsourcing Solution for their contributions to this monumental project. Their expertise in human resource management has played a crucial role in ensuring that the renovation was executed smoothly, employing both local and international talent. This achievement not only reflects Belimuno's commitment to excellence but also highlights our ongoing support for initiatives that celebrate and preserve Ethiopia's cultural heritage.
      </p>
      <p>
        The official inauguration of the renovated Africa Hall took place on October 21, 2024, where dignitaries gathered to celebrate this landmark achievement. As we reflected on this event, we were proud to have been part of a project that reinforced the importance of historical preservation and cultural identity in Africa.
      </p>
    `,
    date: "2024-10-21",
    category: "Company News",
    imageUrl: "/news/news3.jpg",
    readTime: "6 min read",
    author: "Belimuno Team",
  },
];
