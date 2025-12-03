/* eslint-disable no-irregular-whitespace */
import { TypeAnimation } from "react-type-animation";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo";
import { Card, CardContent, CardHeader, CardTitle } from "../common/card";
import {
  FaBolt,
  FaBalanceScale,
  FaLink,
  FaUsers,
  FaChartBar,
  FaSync,
  FaArrowRight,
  FaLock,
  FaCheckCircle,
  FaUserSecret,
  FaEye,
  FaDice,
  FaFileExcel,
} from "react-icons/fa";
import { Button } from "../common/button";

const LandingPage = () => {
  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stats = [
    { value: "2 min", label: "Setup time" },
    { value: "100%", label: "Anonymous" },
    { value: "Zero", label: "Manual work" },
  ];

  const features = [
    {
      title: "Instant Generation",
      description:
        "Define your parameters and let our algorithm generate the perfect group structure instantly.",
      icon: <FaBolt className="text-2xl text-blue-600" />,
      bgColor: "bg-blue-100",
    },
    {
      title: "Smart Balancing",
      description:
        "Ensure every group has the exact mix of roles and skills you need for success.",
      icon: <FaBalanceScale className="text-2xl text-indigo-600" />,
      bgColor: "bg-indigo-100",
    },
    {
      title: "Total Anonymity",
      description:
        "Matches are revealed only to participants. Keep the surprise alive.",
      icon: <FaUserSecret className="text-2xl text-indigo-600" />,
      bgColor: "bg-indigo-100",
    },
    {
      title: "Seamless Sharing",
      description:
        "Share a single link. Participants join and are automatically placed in the right slot.",
      icon: <FaLink className="text-2xl text-purple-600" />,
      bgColor: "bg-purple-100",
    },
  ];

  const painPoints = [
    {
      title: "Hours of manual sorting",
      icon: <FaChartBar className="text-3xl mb-2 text-red-500" />,
    },
    {
      title: "Messy spreadsheets",
      icon: <FaFileExcel className="text-3xl mb-2 text-red-500" />,
    },
    {
      title: "Last-minute changes",
      icon: <FaSync className="text-3xl mb-2 text-red-500" />,
    },
    {
      title: "Accidental reveals",
      icon: <FaEye className="text-3xl mb-2 text-red-500" />,
    },
    {
      title: "Manual name drawing chaos",
      icon: <FaDice className="text-3xl mb-2 text-red-500" />,
    },
  ];

  const capabilities = [
    {
      title: "Auto-Locking Filled Slots",
      description:
        "Once a spot is claimed, it's locked. No double-assignments, no race conditions.",
      icon: <FaLock className="w-5 h-5 text-[#60E1B1]" />,
    },
    {
      title: "Zero Oversubscription",
      description:
        "Hard caps on group sizes. Can't have 5 people join a 4-person group.",
      icon: <FaCheckCircle className="w-5 h-5 text-[#60E1B1]" />,
    },
    {
      title: "Role Caps Per Group",
      description:
        "Need exactly 1 leader, 2 engineers per team? PairForm enforces it automatically.",
      icon: <FaUsers className="w-5 h-5 text-[#60E1B1]" />,
    },
    {
      title: "Live Rebalancing",
      description:
        "Track fills in real-time. Instantly see which groups need attention.",
      icon: <FaSync className="w-5 h-5 text-[#60E1B1]" />,
    },
  ];

  const steps = [
    {
      title: "Define Your Event",
      description:
        "Enter total participants, number of groups, and role structure. PairForm validates everything automatically.",
    },
    {
      title: "Generate Groups",
      description:
        "Click generate and PairForm creates balanced group structures with empty slots ready to fill.",
    },
    {
      title: "Share the Link",
      description:
        "Copy and send the join link to participants. No accounts or logins required for them.",
    },
    {
      title: "Watch It Fill",
      description:
        "Participants pick their role and are auto-assigned. You watch the live dashboard update.",
    },
  ];

  const groupSizes = ["1:1 Pairings", "Small Groups", "Role-Based Teams"];

  const perfectFor = [
    {
      title: "Workshops & Events",
      description:
        "Organize hackathons, design sprints, and team-building events with balanced skill distribution.",
    },
    {
      title: "Educational Settings",
      description:
        "Create project teams for courses, ensuring every group has diverse roles and expertise.",
    },
    {
      title: "Corporate Training",
      description:
        "Form cross-functional teams for training sessions with automatic role balancing.",
    },
  ];

  const onGetStarted = () => {
    // Navigate to sign up or handle click
    window.location.href = "/sign-up";
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-6 max-w-7xl mx-auto">
        <Link to="/home">
          <div className="flex items-center gap-2 py-5">
            <div className="w-10 h-10">
              <Logo />
            </div>
            <p className="pt-3 font-semibold text-black">Pair Form</p>
          </div>
        </Link>
        <div className="flex gap-2 md:gap-4">
          <Link
            to="/login"
            className="px-3 py-2 md:px-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/sign-up"
            className="px-3 py-2 md:px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 mt-12 mb-20 md:mt-20 md:mb-32">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-medium mb-8">
          <span className="flex w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          Smart automation for balanced groups
        </div>
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl">
          Pairing formation, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            perfected.
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Effortlessly organize workshops, classes, and events. Create Balanced
          Groups in Minutes No spreadsheets. No chaos. Just seamless, automated
          team formation with role balancing built in seconds, not hours.
        </p>

        {/* Stats */}
        <div className="flex items-center gap-8 pt-4 mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center">
              <div>
                <div className="text-2xl flex items-center gap-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
              {index < stats.length - 1 && (
                <div className="w-px h-12 bg-border ml-8" />
              )}
            </div>
          ))}
        </div>
        <div className="bg-[#60E1B1]/10 border border-[#60E1B1]/30 rounded-lg px-4 py-3 mb-10 min-h-[52px] flex items-center justify-center">
          <p className="text-sm">
            <span className="text-[#60E1B1] mr-2">✓</span>
            <TypeAnimation
              sequence={[
                "Used by organizers running Secret Santa for teams of 10–200+ people",
                2000,
                "Used by facilitators running workshops of 20–300 participants.",
                2000,
                "Designed for real workshops, trainings, hackathons, and classrooms.",
                2000,
                "Built by facilitators who were tired of fixing team rosters at 1 a.m.",
                2000,
                "Thousands of participants placed into balanced teams instantly.",
                2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </p>
        </div>

        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4">
          <Link
            to="/sign-up"
            className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Create Balanced Pairings
          </Link>
          <button
            className="px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
            onClick={scrollToHowItWorks}
          >
            See How It Works
          </button>
        </div>
      </main>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-7xl font-medium text-gray-900 mb-6 ">
              The Old Way Was Broken
            </h2>
            <p className="text-xl text-muted-foreground">
              Organizers waste hours manually forming balanced groups. Managing
              roles, distributing participants evenly, and updating assignments
              as people join is slow, error-prone, and chaotic.
            </p>
            <div className="flex gap-6 pt-8">
              {painPoints.map((point, index) => (
                <Card
                  key={index}
                  className="border-destructive/20 bg-destructive/5"
                >
                  <CardContent className=" flex flex-col pt-6 text-center items-center">
                    {point.icon}
                    <p>{point.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 ">
                Where Spreadsheets Stop, PairForm Starts{" "}
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
                Built for real-world complexity, not just simple randomization
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {capabilities.map((cap, index) => (
                <Card key={index} className="border-[#60E1B1]/30 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-[#60E1B1]/10 rounded-lg flex items-center justify-center">
                          {cap.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2">{cap.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cap.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 bg-[#FFC857]/10 border border-[#FFC857]/30 rounded-lg px-6 py-4">
              <p className="text-sm text-center">
                <strong className="text-[#3A76F0]">No manual tracking.</strong>{" "}
                PairForm automatically balances as participants join — even if
                they join late.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 ">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground mt-4">
              Powerful features that make Pairing effortless
            </p>
          </div>
          <div className="flex gap-8 md:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div
                  className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 ">
              How PairForm Works
            </h2>
            <p className="text-xl text-muted-foreground mt-4">
              Four simple steps to perfectly balanced groups
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-[#3A76F0] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <div className="space-y-2">
                  <h3>{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 ">
              Perfect For
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {perfectFor.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[#3A76F0] to-[#4650E5] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className=" px-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <FaUsers className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white">Works for Any Group Size</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Whether you need simple 1:1 Secret Santa pairings or small
              balanced groups for team activities, PairForm adapts to your
              needs. From 4 people to 400.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {groupSizes.map((size, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
                >
                  <div className="text-sm text-white/80">{size}</div>
                </div>
              ))}
            </div>
            <p className="text-xl text-white/90">
              Join organizers who've saved hours on group formation. Get started
              in less than 3 minutes.
            </p>

            <Button
              onClick={onGetStarted}
              size="lg"
              variant="secondary"
              className="bg-white text-[#3A76F0] hover:bg-white/90"
            >
              Generate Balanced Pairings
              <FaArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/home">
                <div className="flex items-center gap-2 py-5">
                  <div className="w-10 h-10">
                    <Logo />
                  </div>
                  <p className="pt-3 font-semibold text-black">Pair Form</p>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground max-w-md">
                Smart automation for balanced groups. Built for real workshops,
                Secret Santa events, and team formation — not demos.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li
                  onClick={scrollToHowItWorks}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  How it works
                </li>
                <li
                  onClick={onGetStarted}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  Get started
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Use Cases</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Secret Santa</li>
                <li>Team workshops</li>
                <li>Group formation</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 PairForm. Secret Santa made simple.
              </p>
              <p className="text-xs text-muted-foreground">
                No spreadsheets. No manual pairing. Just balanced groups.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
