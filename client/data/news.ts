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
    title: "Belimuno Jobs Platform Reaches 10,000+ Active Users",
    excerpt:
      "We're excited to announce that our platform has reached a major milestone with over 10,000 active users across Ethiopia.",
    content: `
      <p>We are thrilled to announce a significant milestone in our journey to revolutionize the job market in Ethiopia. Belimuno Jobs has officially reached over 10,000 active users across the country!</p>
      
      <p>This achievement represents more than just a number – it symbolizes the trust and confidence that thousands of professionals and businesses have placed in our platform. Since our launch, we've been committed to connecting skilled workers with meaningful employment opportunities.</p>
      
      <h3>What This Means for Our Community</h3>
      <p>With 10,000+ active users, our platform now hosts one of the largest professional networks in Ethiopia. This growth has enabled us to:</p>
      <ul>
        <li>Connect more workers with diverse job opportunities</li>
        <li>Provide businesses with access to a larger talent pool</li>
        <li>Improve our matching algorithms based on user feedback</li>
        <li>Expand our services to new regions across Ethiopia</li>
      </ul>
      
      <h3>Looking Ahead</h3>
      <p>As we celebrate this milestone, we're also looking forward to the future. Our team is working on exciting new features including:</p>
      <ul>
        <li>Enhanced mobile application with offline capabilities</li>
        <li>Advanced job matching using AI technology</li>
        <li>Expanded partnership network with leading Ethiopian companies</li>
        <li>Professional development and training programs</li>
      </ul>
      
      <p>We want to thank all our users, partners, and supporters who have made this achievement possible. Together, we're building a stronger, more connected workforce for Ethiopia.</p>
    `,
    date: "2024-01-15",
    category: "Platform Update",
    imageUrl: "/belimuno.png",
    readTime: "5 min read",
    author: "Belimuno Team",
  },
  {
    id: "2",
    title: "New Mobile App Launch - Apply for Jobs on the Go",
    excerpt:
      "Download our new mobile application to browse and apply for jobs directly from your smartphone.",
    content: `
      <p>We're excited to announce the launch of our brand new mobile application! The Belimuno Jobs mobile app is now available for download on both iOS and Android platforms.</p>
      
      <p>This mobile app brings the full power of our job platform directly to your smartphone, making it easier than ever to find and apply for jobs while on the go.</p>
      
      <h3>Key Features</h3>
      <p>Our mobile app includes all the features you love from our web platform, plus some mobile-exclusive enhancements:</p>
      <ul>
        <li><strong>Smart Job Matching:</strong> Get personalized job recommendations based on your skills and preferences</li>
        <li><strong>Push Notifications:</strong> Receive instant alerts for new job postings that match your profile</li>
        <li><strong>Offline Mode:</strong> Browse saved jobs even without an internet connection</li>
        <li><strong>Quick Apply:</strong> Apply to jobs with just a few taps</li>
        <li><strong>Profile Management:</strong> Update your profile and skills directly from your phone</li>
        <li><strong>Real-time Chat:</strong> Communicate with employers instantly through our built-in messaging system</li>
      </ul>
      
      <h3>Download Now</h3>
      <p>The app is available for free download from:</p>
      <ul>
        <li>Google Play Store (Android)</li>
        <li>Apple App Store (iOS)</li>
      </ul>
      
      <p>Simply search for "Belimuno Jobs" in your device's app store and start your job search journey today!</p>
      
      <h3>What Users Are Saying</h3>
      <p>"The mobile app has made job searching so much more convenient. I can apply for jobs during my commute!" - Sarah M., Software Developer</p>
      
      <p>"The push notifications are a game-changer. I never miss an opportunity anymore." - Ahmed K., Marketing Professional</p>
    `,
    date: "2024-01-10",
    category: "Product Launch",
    imageUrl: "/belimuno.png",
    readTime: "4 min read",
    author: "Product Team",
  },
  {
    id: "3",
    title: "Partnership with Leading Ethiopian Companies",
    excerpt:
      "We've partnered with top companies including Ethiopian Airlines, Commercial Bank of Ethiopia, and more.",
    content: `
      <p>We're proud to announce strategic partnerships with some of Ethiopia's most prestigious companies. These partnerships represent a significant step forward in our mission to connect the best talent with the best opportunities.</p>
      
      <h3>Our New Partners</h3>
      <p>We're excited to welcome the following companies to our platform:</p>
      
      <h4>Ethiopian Airlines</h4>
      <p>As Africa's largest airline, Ethiopian Airlines brings a wealth of opportunities in aviation, customer service, engineering, and management roles. Through this partnership, we'll help them find skilled professionals for their growing operations.</p>
      
      <h4>Commercial Bank of Ethiopia</h4>
      <p>Ethiopia's largest commercial bank is now using our platform to recruit talented individuals for various positions in banking, finance, and customer service.</p>
      
      <h4>Additional Partners</h4>
      <p>We're also proud to partner with:</p>
      <ul>
        <li>Dashen Bank</li>
        <li>Ethiopian Telecommunications Corporation (Ethio Telecom)</li>
        <li>Hilton Addis Ababa</li>
        <li>Sheraton Addis Ababa</li>
        <li>Various construction and engineering firms</li>
      </ul>
      
      <h3>What This Means for Job Seekers</h3>
      <p>These partnerships open up exciting new opportunities for job seekers:</p>
      <ul>
        <li>Access to exclusive job postings from top-tier companies</li>
        <li>Higher salary ranges and better benefits</li>
        <li>Career growth opportunities in established organizations</li>
        <li>Professional development programs</li>
      </ul>
      
      <h3>What This Means for Employers</h3>
      <p>Our partner companies benefit from:</p>
      <ul>
        <li>Access to pre-screened, qualified candidates</li>
        <li>Faster recruitment processes</li>
        <li>Reduced hiring costs</li>
        <li>Better candidate-employer matching</li>
      </ul>
      
      <p>We're committed to expanding our partner network to include more leading companies across various industries. Stay tuned for more exciting partnership announcements!</p>
    `,
    date: "2024-01-05",
    category: "Partnership",
    imageUrl: "/belimuno.png",
    readTime: "6 min read",
    author: "Partnership Team",
  },
];
