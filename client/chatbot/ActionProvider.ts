interface ChatBotMessage {
  withAvatar?: boolean;
  message?: string;
}

type CreateChatBotMessage = (
  message: string,
  options?: ChatBotMessage,
) => ChatBotMessage;

interface ChatBotState {
  messages: ChatBotMessage[];
}

type SetStateFunc = (func: (prevState: ChatBotState) => ChatBotState) => void;

class ActionProvider {
  private createChatBotMessage: CreateChatBotMessage;
  private setState: SetStateFunc;

  constructor(
    createChatBotMessage: CreateChatBotMessage,
    setStateFunc: SetStateFunc,
  ) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  handleGreeting() {
    // Determine time of day for dynamic greeting
    const currentHour = new Date().getHours();
    const timeOfDay =
      currentHour < 12
        ? "Good morning"
        : currentHour < 18
          ? "Good afternoon"
          : "Good evening";

    // Construct the greeting message
    const message = this.createChatBotMessage(
      `${timeOfDay}! Welcome to Belimuno Jobs! 👋 How can I assist you today?\n\n` +
        `If you'd like to know what I can help with, just type "help" to see a list of topics.`,
    );

    this.updateChatbotState(message);
  }

  handleIntroduction() {
    const message = this.createChatBotMessage(
      "I am Belimuno Bot! 👋\n\n" +
        "Belimuno Jobs is Ethiopia's premier HR outsourcing platform, connecting skilled workers with businesses across the country since 2011. " +
        "We help businesses scale with flexible, high-quality workforce solutions.\n\n" +
        "Our company has:\n" +
        "- An annual turnover of about 200 million birr\n" +
        "- Over 3000 employees managed across 36 organizations\n" +
        "- Partnerships with international NGOs and construction firms\n\n" +
        "How can I assist you today?",
    );
    this.updateChatbotState(message);
  }

  handleHelp() {
    const message = this.createChatBotMessage(
      `Hello! I'm here to help you with information about Belimuno Jobs. Here are some topics I can assist you with:
    
          - 👥 Manpower Supply & Outsourcing
          - 🎯 Recruitment & Hiring
          - 🎓 Training & Development
          - 🏢 HR Consultancy
          - 📊 Project Management
          - 📞 Contact Information
          - ℹ️ About Belimuno
          - 🌟 Vision & Mission
          - 👔 Our Team
          - 💼 Job Opportunities
          - 📍 Office Location
    
        Just type a keyword (e.g., "services", "jobs", or "contact") for more information on a specific topic!`,
    );

    this.updateChatbotState(message);
  }

  handleServices() {
    const message = this.createChatBotMessage(
      "We offer comprehensive HR solutions including:\n\n" +
        "1. Professional Manpower Supply\n" +
        "   - Professional and non‑professional staffing\n" +
        "   - Deep candidate network and rigorous vetting\n\n" +
        "2. End-to-end Outsourcing Services\n" +
        "   - Cleaners, security guards, construction crews\n" +
        "   - Fleet management professionals\n\n" +
        "3. Recruitment for Employers\n" +
        "   - Targeted hiring campaigns\n" +
        "   - Assessments and onboarding coordination\n\n" +
        "4. HR Consultancy\n" +
        "   - Policies and org design\n" +
        "   - Performance systems and compliance\n\n" +
        "5. Training & Development\n" +
        "   - Soft skills and technical training\n" +
        "   - HSE and customer service\n\n" +
        "6. Project-based Crews\n" +
        "   - Construction and logistics\n" +
        "   - Facilities management\n\n" +
        "Would you like to know more about any specific service?",
    );
    this.updateChatbotState(message);
  }

  handleManpowerServices() {
    const message = this.createChatBotMessage(
      "Our manpower services include:\n\n" +
        "- Professional and non‑professional staffing with a deep candidate network\n" +
        "- End‑to‑end outsourcing of cleaners, security guards, and construction crews\n" +
        "- Currently managing over 3000 employees for 36 organizations\n" +
        "- Comprehensive supervision and management\n\n" +
        "Would you like to learn more about our recruitment process or discuss your staffing needs?",
    );
    this.updateChatbotState(message);
  }

  handleRecruitment() {
    const message = this.createChatBotMessage(
      "Our recruitment services include:\n\n" +
        "- Targeted hiring campaigns\n" +
        "- Professional assessments\n" +
        "- Onboarding coordination\n" +
        "- Deep candidate network\n" +
        "- Services for both local and international firms\n\n" +
        "We help businesses scale with flexible, high-quality workforce solutions.\n\n" +
        "You can hire workers by visiting our website at www.belimunojobs.com and buying a job package to get the best workers for your business.\n\n" +
        "Contact us if you would like to know more about our recruitment process or discuss your staffing needs.",
    );
    this.updateChatbotState(message);
  }

  handleTraining() {
    const message = this.createChatBotMessage(
      "We provide comprehensive training programs in:\n\n" +
        "- Soft skills development\n" +
        "- Security operations\n" +
        "- Cleaning services\n" +
        "- HSE (Health, Safety, Environment)\n" +
        "- Site operations\n" +
        "- Customer service\n\n" +
        "Our training ensures your workforce is well-prepared and professional.",
    );
    this.updateChatbotState(message);
  }

  handleContact() {
    const message = this.createChatBotMessage(
      "You can reach us at:\n\n" +
        "📍 Address: Bole Medhaniyalem to Hayahulet Road, in front of New Stadium, ANAT Commercial Center, 4th floor Office No. 402\n\n" +
        "📧 Email: info@belimunojobs.com\n" +
        "📞 Phone: +251 0118 69 78 80\n" +
        "📮 P.O.Box: 100144, Addis Ababa\n" +
        "🌐 Website: www.belimunojobs.com",
    );
    this.updateChatbotState(message);
  }

  handleAbout() {
    const message = this.createChatBotMessage(
      "Belimuno HR outsourcing solution was established in 2011 as Belimuno recruiting service. We've grown to become one of the fast-growing firms in the sector with:\n\n" +
        "- Annual turnover of about 200 million birr\n" +
        "- Serving international NGOs like WFP, NRS, and FHI\n" +
        "- Working with major construction firms like China Genzuba group\n" +
        "- Managing over 3000 employees across 36 organizations\n\n" +
        "Would you like to know more about our vision, mission, or services?",
    );
    this.updateChatbotState(message);
  }

  handleVisionMission() {
    const message = this.createChatBotMessage(
      "🎯 Vision:\n" +
        "To be the most reliable human resource outsourcing service providers and trusted partners through staffing a tailored to fit manpower to our clients.\n\n" +
        "🚀 Mission:\n" +
        "Searching, refining and staffing professional and non-professional manpower where they best fit and consult our clients with ideas leading them to success.\n\n" +
        "Our core values include Adhocracy, Reliability, Trustworthiness, Integrity, and Innovation.",
    );
    this.updateChatbotState(message);
  }

  handleTeam() {
    const message = this.createChatBotMessage(
      "Our company is structured into three main departments:\n\n" +
        "1. Administration and Finance\n" +
        "2. Human Resources\n" +
        "3. Outsourced Service Management\n\n" +
        "Each department is led by experienced professionals dedicated to delivering excellence in HR solutions.",
    );
    this.updateChatbotState(message);
  }

  handleApply() {
    const message = this.createChatBotMessage(
      "Looking for job opportunities? Here's how to get started:\n\n" +
        "1. Browse Available Jobs:\n" +
        "   - Visit www.belimunojobs.com/jobs\n" +
        "   - Use filters for category, region, and budget\n" +
        "   - View detailed job descriptions\n\n" +
        "2. Application Process:\n" +
        "   - Create/login to your account\n" +
        "   - Submit your proposal\n" +
        "   - Specify your budget and timeline\n\n" +
        "3. Track Applications:\n" +
        "   - Monitor status in your dashboard\n" +
        "   - Receive notifications\n" +
        "   - Communicate with clients\n\n" +
        "Ready to start? Visit our jobs page or type 'help' for more information!",
    );
    this.updateChatbotState(message);
  }

  handleClientInfo() {
    const message = this.createChatBotMessage(
      "For Employers and Clients:\n\n" +
        "📋 Post a Job:\n" +
        "- Create detailed job listings\n" +
        "- Set budget and requirements\n" +
        "- Review applications\n\n" +
        "👥 Find Workers:\n" +
        "- Access our skilled worker database\n" +
        "- Review worker profiles and ratings\n" +
        "- Direct hiring or outsourcing options\n\n" +
        "💼 Client Dashboard Features:\n" +
        "- Manage active projects\n" +
        "- Track worker performance\n" +
        "- Process payments securely\n" +
        "- Generate reports\n\n" +
        "Need more information? Type 'services' or 'contact' for assistance!",
    );
    this.updateChatbotState(message);
  }

  handleWorkerInfo() {
    const message = this.createChatBotMessage(
      "For Workers and Freelancers:\n\n" +
        "📊 Dashboard Features:\n" +
        "- Track active jobs and applications\n" +
        "- Monitor earnings and ratings\n" +
        "- View job history\n\n" +
        "💰 Earnings Management:\n" +
        "- Secure payment processing\n" +
        "- Track pending payments\n" +
        "- Withdrawal options\n\n" +
        "📈 Growth Opportunities:\n" +
        "- Build your profile\n" +
        "- Improve your skills\n" +
        "- Get client ratings\n\n" +
        "Want to get started? Type 'apply' to learn about job applications!",
    );
    this.updateChatbotState(message);
  }

  handlePaymentInfo() {
    const message = this.createChatBotMessage(
      "Payment and Wallet Information:\n\n" +
        "💳 For Clients:\n" +
        "- Secure payment via Chapa\n" +
        "- Bank-grade security\n" +
        "- Process payments for completed work\n" +
        "- Track payment history\n\n" +
        "💰 For Workers:\n" +
        "- Track earnings in your wallet\n" +
        "- View payment status\n" +
        "- Secure withdrawal options\n" +
        "- Transaction history\n\n" +
        "Need help with payments? Contact our support team!",
    );
    this.updateChatbotState(message);
  }

  handleTrainingPrograms() {
    const message = this.createChatBotMessage(
      "Training & Development Programs:\n\n" +
        "🎓 Available Programs:\n" +
        "- Soft skills development\n" +
        "- Security operations\n" +
        "- Cleaning services\n" +
        "- HSE (Health, Safety, Environment)\n" +
        "- Site operations\n" +
        "- Customer service excellence\n\n" +
        "📚 Program Features:\n" +
        "- Professional certification\n" +
        "- Practical training\n" +
        "- Industry-standard curriculum\n" +
        "- Expert instructors\n\n" +
        "Want to enhance your skills? Contact us for program details!",
    );
    this.updateChatbotState(message);
  }

  handleDefault() {
    const message = this.createChatBotMessage(
      "I'm not sure I understand. Could you please rephrase that or try one of these options:\n\n" +
        "- Type 'help' to see all topics I can assist with\n" +
        "- Type 'services' to learn about our HR solutions\n" +
        "- Type 'jobs' to explore job opportunities\n" +
        "- Type 'contact' to get our contact information\n\n" +
        "I'm here to help you learn more about Belimuno Jobs and our services!",
      {
        withAvatar: true,
      },
    );
    this.updateChatbotState(message);
  }

  updateChatbotState(message: ChatBotMessage): void {
    this.setState((prevState: ChatBotState) => ({
      ...prevState,
      messages: [...prevState.messages, message],
    }));
  }
}

export default ActionProvider;
