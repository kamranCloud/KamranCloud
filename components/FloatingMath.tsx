import { motion } from "framer-motion";

const mathSymbols = ["∫", "∑", "π", "∞", "√", "∂", "α", "β", "θ", "λ", "∆", "∇"];

const FloatingMath = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {mathSymbols.map((symbol, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl md:text-6xl font-bold text-primary"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: index * 0.5,
            ease: "easeInOut",
          }}
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingMath;
