import fs from 'fs';

const path = 'src/features/templates/pages/TemplatesPage.jsx';
let s = fs.readFileSync(path, 'utf8');

// Fix specific lines where motion.div was closed with div
const pairs = [
  // SearchResultRow
  [
    `      <motion.div layout className="w-8 h-8 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-[#6b6966]" />
      </motion.div>`,
    `      <motion.div layout className="w-8 h-8 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-[#6b6966]" />
      </motion.div>`.replace('</motion.div>', '</' + 'motion.div>'.replace('motion.', '')),
  ],
];

// Simpler: replace patterns where we know motion.div opens but div closes
const fixes = [
  [/(<motion\.motion\.div layout className="w-8 h-8[\s\S]*?<\/motion\.motion\.motion\.div>)/, (m) => m.replace('</motion.div>', '</motion.div>'.replace('motion.', ''))],
];

// Direct replacements
s = s.replace(
  `      <motion.div layout className="w-8 h-8 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-[#6b6966]" />
      </motion.div>`,
  `      <motion.div layout className="w-8 h-8 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-[#6b6966]" />
      </motion.div>`
);

const md = '</' + 'motion.div>';
const d = '</' + 'motion.div>'.replace('motion.', '');

// Fix SearchResultRow second close
s = s.replace(
  `        </span>
      </motion.div>
    </button>
  );
};

const TemplatesPage`,
  `        </span>
      ${md}
    </button>
  );
};

const TemplatesPage`
);

// Fix empty dropdown inner
s = s.replace(
  `                    </div>
                  </motion.div>

                  {didYouMean.length`,
  `                    </div>
                  ${md}

                  {didYouMean.length`
);

// Fix dropdown motion close
s = s.replace(
  `                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>`,
  `                </motion.div>
              )}
            ${md}
          )}
        </AnimatePresence>
      </motion.div>`
);

// Fix skeleton motion wrappers
s = s.replace(
  `          <TemplatesSkeleton />
        </motion.div>
      )}

      {loadStage === 'partial'`,
  `          <TemplatesSkeleton />
        ${md}
      )}

      {loadStage === 'partial'`
);

s = s.replace(
  `          <TemplatesPartialSkeleton />
        </motion.div>
      )}

      {loadStage === 'empty'`,
  `          <TemplatesPartialSkeleton />
        ${md}
      )}

      {loadStage === 'empty'`
);

// Fix empty/error/loaded stage wrappers
s = s.replace(
  `                <EmptyTemplatesBody />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {loadStage === 'error'`,
  `                <EmptyTemplatesBody />
              </motion.div>
            ${d}
          </motion.div>
        ${md}
      )}

      {loadStage === 'error'`
);

s = s.replace(
  `                <GreyedOutGrid />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {loadStage === 'loaded'`,
  `                <GreyedOutGrid />
              </motion.div>
            ${d}
          </motion.div>
        ${md}
      )}

      {loadStage === 'loaded'`
);

s = s.replace(
  `              {renderTemplateGrid()}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>`,
  `              {renderTemplateGrid()}
            ${d}
          </motion.div>
        ${md}
      )}
    </AnimatePresence>`
);

fs.writeFileSync(path, s);
console.log('fixed motion closes');
