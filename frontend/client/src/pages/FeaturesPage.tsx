import { motion } from 'framer-motion';

interface FeaturesPageProps {
  onGetStarted: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export function FeaturesPage({ onGetStarted }: FeaturesPageProps) {
  const capabilities = [
    {
      category: 'Document Processing',
      items: [
        { title: 'PDF Parsing', desc: 'Extract text, tables, and metadata from complex PDF layouts with high accuracy.' },
        { title: 'Image OCR', desc: 'Process PNG, JPG, HEIC, WebP, and TIFF images with intelligent text extraction.' },
        { title: 'DOCX Support', desc: 'Full Microsoft Word document support with formatting preservation.' },
        { title: 'HTML Ingestion', desc: 'Parse and index web pages and HTML documents seamlessly.' },
      ],
    },
    {
      category: 'AI & Retrieval',
      items: [
        { title: 'Semantic Search', desc: 'Vector-based similarity search understands meaning, not just keywords.' },
        { title: 'Hybrid Mode', desc: 'Combine document knowledge with general AI capabilities for comprehensive answers.' },
        { title: 'Strict Mode', desc: 'Restrict answers to only document-grounded content for maximum accuracy.' },
        { title: 'Source Citations', desc: 'Every answer includes traceable citations back to original document sections.' },
      ],
    },
    {
      category: 'Workspace',
      items: [
        { title: 'Multi-Session', desc: 'Organize research into separate sessions with independent document sets.' },
        { title: 'Session Cloning', desc: 'Duplicate sessions to explore different research directions.' },
        { title: 'Chat Export', desc: 'Export conversations as Markdown for sharing and archiving.' },
        { title: 'Pin Messages', desc: 'Pin important answers for quick reference within sessions.' },
      ],
    },
  ];

  const techStack = [
    { name: 'FastAPI', role: 'Backend API', color: 'from-emerald-500 to-teal-500' },
    { name: 'ChromaDB', role: 'Vector Store', color: 'from-amber-500 to-orange-500' },
    { name: 'HuggingFace', role: 'LLM & Embeddings', color: 'from-yellow-500 to-amber-500' },
    { name: 'Firebase', role: 'Authentication', color: 'from-orange-500 to-red-500' },
    { name: 'React', role: 'Frontend', color: 'from-cyan-500 to-blue-500' },
    { name: 'Framer Motion', role: 'Animations', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="relative min-h-screen pt-24 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div {...fadeInUp} className="text-center mb-20">
          <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase">Deep Dive</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-3 mb-5">
            Platform <span className="text-gradient">Capabilities</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Explore the full range of features that make NexusRAG the most powerful document intelligence platform.
          </p>
        </motion.div>

        {/* Capability Sections */}
        {capabilities.map((section, si) => (
          <motion.div key={si} {...fadeInUp} className="mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-500 to-blue-500" />
              {section.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {section.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group p-6 rounded-xl glass hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-violet-400">
                        <path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Tech Stack */}
        <motion.div {...fadeInUp} className="mb-20">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-cyan-400 tracking-wider uppercase">Technology</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">Built with Modern Tech</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className="p-5 rounded-xl glass text-center group hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tech.color} mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {tech.name[0]}
                </div>
                <div className="font-semibold text-white text-sm">{tech.name}</div>
                <div className="text-xs text-slate-500 mt-1">{tech.role}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeInUp} className="text-center">
          <motion.button
            onClick={onGetStarted}
            className="btn-primary text-lg px-10 py-4 rounded-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try NexusRAG Now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
