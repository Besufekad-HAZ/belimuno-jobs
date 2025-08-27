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

    if (lowerCase.includes("hello") || lowerCase.includes("hi")) {
      this.actionProvider.handleGreeting();
      return;
    }

    if (
      lowerCase.includes("who are you") ||
      lowerCase.includes("what is belimuno") ||
      lowerCase.includes("belimuno") ||
      lowerCase.includes("belimuno jobs")
    ) {
      this.actionProvider.handleIntroduction();
      return;
    }

    if (lowerCase.includes("help")) {
      this.actionProvider.handleHelp();
      return;
    }

    if (
      lowerCase.includes("services") ||
      lowerCase.includes("what do you offer") ||
      lowerCase.includes("what do you do")
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

    if (
      lowerCase.includes("apply") ||
      lowerCase.includes("job") ||
      lowerCase.includes("jobs") ||
      lowerCase.includes("career") ||
      lowerCase.includes("opportunities") ||
      lowerCase.includes("job opportunities")
    ) {
      this.actionProvider.handleApply();
      return;
    }

    // Default response for unrecognized messages
    this.actionProvider.handleDefault();
  }
}

export default MessageParser;
