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
      "I am Belimuno Bot! We are Ethiopia's premier HR outsourcing platform, connecting skilled workers with businesses across the country since 2011. How can I assist you today?",
    );
    this.updateChatbotState(message);
  }

  handleHelp() {
    const message = this.createChatBotMessage(
      `Hello! I'm here to help you with information about Belimuno Jobs. Here are some topics I can assist you with:
    
          - 👥 Manpower Supply & Outsourcing
          - 🎯 Recruitment Services
          - 🎓 Training & Development
          - 🏢 HR Consultancy
          - 📞 Contact Information
          - ℹ️ About Belimuno
          - 🌟 Vision & Mission
          - 👔 Our Team
    
        Just type a keyword (e.g., "services" or "contact") for more information on a specific topic!`,
    );

    this.updateChatbotState(message);
  }

  handleServices() {
    const message = this.createChatBotMessage(
      "We offer comprehensive HR solutions including:\n\n" +
        "1. Professional Manpower Supply\n" +
        "2. End-to-end Outsourcing Services\n" +
        "3. Recruitment for Employers\n" +
        "4. HR Consultancy\n" +
        "5. Training & Development\n" +
        "6. Project-based Crews\n\n" +
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
      "You can apply for a job by visiting our website at www.belimunojobs.com/jobs and find the perfect opportunity for your skills.",
    );
    this.updateChatbotState(message);
  }

  handleDefault() {
    const message = this.createChatBotMessage(
      "I'm not sure I understand. Could you please rephrase that or type:-\n" +
        "-'help' to see what information I can provide about our coffee export services.\n" +
        "-'contact' if you have more questions about our website.",
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
