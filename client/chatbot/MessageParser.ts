interface ActionProvider {
  [action: string]: () => void;
}

interface ChatState {
  userData: Record<string, unknown>;
}

class MessageParser {
  private actionProvider: ActionProvider;
  private state: ChatState;

  constructor(actionProvider: ActionProvider, state: ChatState) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message: string): void {
    const lowerCase = message.toLowerCase();

    // Greetings
    if (
      lowerCase.includes("hello") ||
      lowerCase.includes("hi") ||
      lowerCase.includes("hey")
    ) {
      this.actionProvider.handleGreeting();
      return;
    }

    // Introduction and company info
    if (
      lowerCase.includes("who are you") ||
      lowerCase.includes("what is belimuno") ||
      lowerCase.includes("belimuno") ||
      lowerCase.includes("belimuno jobs") ||
      lowerCase.includes("tell me about") ||
      lowerCase.includes("company info")
    ) {
      this.actionProvider.handleIntroduction();
      return;
    }

    // Help and navigation
    if (
      lowerCase.includes("help") ||
      lowerCase.includes("guide") ||
      lowerCase.includes("what can you do") ||
      lowerCase.includes("how to use")
    ) {
      this.actionProvider.handleHelp();
      return;
    }

    // Services and offerings
    if (
      lowerCase.includes("services") ||
      lowerCase.includes("what do you offer") ||
      lowerCase.includes("what do you do") ||
      lowerCase.includes("hr solutions") ||
      lowerCase.includes("workforce solutions") ||
      lowerCase.includes("staffing")
    ) {
      this.actionProvider.handleServices();
      return;
    }

    if (lowerCase.includes("manpower") || lowerCase.includes("outsourcing")) {
      this.actionProvider.handleManpowerServices();
      return;
    }

    if (lowerCase.includes("recruitment") || lowerCase.includes("hiring")) {
      this.actionProvider.handleRecruitment();
      return;
    }

    if (
      lowerCase.includes("training") ||
      lowerCase.includes("development") ||
      lowerCase.includes("programs")
    ) {
      this.actionProvider.handleTraining();
      return;
    }

    if (
      lowerCase.includes("contact") ||
      lowerCase.includes("office") ||
      lowerCase.includes("location") ||
      lowerCase.includes("address")
    ) {
      this.actionProvider.handleContact();
      return;
    }

    if (
      lowerCase.includes("about") ||
      lowerCase.includes("company") ||
      lowerCase.includes("website") ||
      lowerCase.includes("belimuno website")
    ) {
      this.actionProvider.handleAbout();
      return;
    }

    if (
      lowerCase.includes("vision") ||
      lowerCase.includes("mission") ||
      lowerCase.includes("values")
    ) {
      this.actionProvider.handleVisionMission();
      return;
    }

    if (
      lowerCase.includes("team") ||
      lowerCase.includes("management") ||
      lowerCase.includes("team members")
    ) {
      this.actionProvider.handleTeam();
      return;
    }

    // Job search and applications
    if (
      lowerCase.includes("apply") ||
      lowerCase.includes("job") ||
      lowerCase.includes("jobs") ||
      lowerCase.includes("career") ||
      lowerCase.includes("opportunities") ||
      lowerCase.includes("job opportunities") ||
      lowerCase.includes("find work") ||
      lowerCase.includes("find job")
    ) {
      this.actionProvider.handleApply();
      return;
    }

    // Client specific queries
    if (
      lowerCase.includes("hire") ||
      lowerCase.includes("post job") ||
      lowerCase.includes("find workers") ||
      lowerCase.includes("recruit") ||
      lowerCase.includes("employer") ||
      (lowerCase.includes("client") && lowerCase.includes("dashboard"))
    ) {
      this.actionProvider.handleClientInfo();
      return;
    }

    // Worker/Freelancer specific
    if (
      lowerCase.includes("freelancer") ||
      lowerCase.includes("worker dashboard") ||
      lowerCase.includes("my applications") ||
      lowerCase.includes("my jobs") ||
      lowerCase.includes("earnings") ||
      lowerCase.includes("work history")
    ) {
      this.actionProvider.handleWorkerInfo();
      return;
    }

    // Payment and wallet
    if (
      lowerCase.includes("payment") ||
      lowerCase.includes("wallet") ||
      lowerCase.includes("earnings") ||
      lowerCase.includes("withdraw") ||
      lowerCase.includes("balance")
    ) {
      this.actionProvider.handlePaymentInfo();
      return;
    }

    // Training programs
    if (
      lowerCase.includes("training program") ||
      lowerCase.includes("skill development") ||
      lowerCase.includes("learn") ||
      lowerCase.includes("courses") ||
      lowerCase.includes("certification")
    ) {
      this.actionProvider.handleTrainingPrograms();
      return;
    }

    // Default response for unrecognized messages
    this.actionProvider.handleDefault();
  }
}

export default MessageParser;
