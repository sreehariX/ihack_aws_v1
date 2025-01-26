export const spamNumbers = [
    { number: "+1*****8910", reports: 142, location: "New York", probability: 0.89 },
    { number: "Unknown", reports: 98, location: "International", probability: 0.76 },
    { number: "+44****1234", reports: 87, location: "London", probability: 0.92 },
  ];
  
  export const statsData = {
    callsAnalyzed: 1250,
    spamDetected: 450,
    accuracyRate: 98.5,
  };
  
  export const generateRandomNumber = () => {
    const prefixes = ["+1", "+44", "+91", "+61"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `${prefix}${number}`;
  };