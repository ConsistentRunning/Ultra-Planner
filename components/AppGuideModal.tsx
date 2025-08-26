
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const WelcomeModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'simple' | 'science'>('simple');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome to the Ultra Planner!" size="3xl">
            <div className="flex border-b border-slate-700 mb-4">
                <button 
                    onClick={() => setActiveTab('simple')}
                    className={`px-4 py-2 text-lg font-semibold ${activeTab === 'simple' ? 'border-b-2 border-accent text-accent' : 'text-muted'}`}
                >
                    Simple Guide
                </button>
                <button 
                    onClick={() => setActiveTab('science')}
                    className={`px-4 py-2 text-lg font-semibold ${activeTab === 'science' ? 'border-b-2 border-accent text-accent' : 'text-muted'}`}
                >
                    The Detailed Science
                </button>
            </div>

            {activeTab === 'simple' ? (
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-li:text-slate-300">
                    <h4>Get a complete race plan in under 5 minutes:</h4>
                    <ol>
                        <li>
                            <strong>Set Your Fitness Baseline:</strong> In the top card, go to "Reference Performance" and enter a recent race result (e.g., your marathon time). The planner uses this to calculate your theoretical "flat time" for the ultra distance.
                        </li>
                        <li>
                            <strong>Define The Course:</strong> The best way is to import the official race GPX file. This automatically populates the total distance, gain, and loss, and enables the detailed pace chart.
                        </li>
                        <li>
                            <strong>Set Up Aid Stations:</strong> Toggle to "By Legs" mode. You can quickly add legs by pasting a comma-separated list of distances between aid stations from the race website, or add them manually. Be sure to fill in your estimated stop times!
                        </li>
                        <li>
                            <strong>Tune Your Runner Profile:</strong> Click the "Runner Profile" button. Start with a preset like "Allrounder" or "Mountain", then adjust sliders to match your unique strengths (e.g., are you a great power-hiker? Do you struggle in heat?). This is the secret to a highly personalized plan.
                        </li>
                         <li>
                            <strong>Automate & Analyze:</strong> Use "Auto-fill Notes" to get context-aware strategic advice for your runner and crew cards. Then, analyze the pace chart and the time breakdown to understand your race dynamics.
                        </li>
                        <li>
                            <strong>Print Your Plan:</strong> Click "Print Cards" to generate handy, pocket-sized cards for yourself and your pacers. You can also print the full plan for your crew from the main race plan view.
                        </li>
                    </ol>
                </div>
            ) : (
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-strong:text-slate-100 prose-headings:text-accent2">
                    <h4>Under the Hood: The Simulation Engine</h4>
                    <p>This planner models your race by breaking the course into 25-meter segments and calculating your pace for each one. This approach allows for a highly detailed and dynamic simulation grounded in established principles of exercise physiology.</p>
                    
                    <h5>1. Grade Adjusted Pace (GAP) & The Hiking Model</h5>
                    <p>The simulation starts with your <strong>Flat Pace</strong> and adjusts it based on the gradient. This isn't a simple linear adjustment; it's an asymmetrical model that reflects the real metabolic cost of running.</p>
                    <ul className="!my-2">
                        <li><strong>Uphills:</strong> The cost of running uphill is primarily about lifting your body against gravity. The model applies a pace penalty that increases with the grade.</li>
                        <li><strong>Downhills:</strong> Gentle downhills can provide a speed benefit, but steep descents are metabolically costly due to the significant braking forces your muscles must exert.</li>
                        <li><strong>Strategic Hiking:</strong> On very steep grades, the model automatically switches to hiking. This is because, beyond a certain gradient (typically around 15-16%), hiking becomes more metabolically efficient than attempting to run. The hiking speed is then calculated based on your VAM (Vertical Ascent Meters/hour).</li>
                    </ul>
                    <div className="text-xs text-slate-400 border-l-2 border-slate-600 pl-3 mt-2">
                        <strong>Research Basis:</strong> The energy cost of running on various gradients has been studied extensively. The U-shaped curve of energy expenditure vs. grade, showing high costs for both steep uphills and downhills, was famously detailed in research by <em>Minetti et al. (2002)</em>. Our model's asymmetrical penalties and strategic hiking threshold are direct applications of these findings.
                    </div>

                    <h5>2. The Dual-Component Fatigue Model</h5>
                    <p>This is the core of the planner. Instead of a single "fatigue" score, it tracks two separate but interacting types of fatigue, reflecting the complex ways your body breaks down over an ultra.</p>
                    
                    <h6>A. Metabolic Fatigue (The "Engine")</h6>
                    <p>This represents cardiovascular strain and energy (glycogen) depletion—the feeling of "running out of gas."</p>
                    <ul className="!my-2">
                        <li><strong>How it's tracked:</strong> The model uses a concept called <strong>"Effort-Seconds."</strong> For every second you run, you accumulate a number of "Effort-Seconds" equal to your current effort level relative to your flat pace. Running uphill at a 1.5x pace factor for 60 seconds adds 90 Effort-Seconds.</li>
                        <li><strong>The Hiking Economy Bonus:</strong> When you hike, the model reduces the number of Effort-Seconds you accumulate (<code>Effort-Seconds * (1 - Hiking Economy Bonus %)</code>). This models the significant energy savings of hiking versus running on steep climbs.</li>
                    </ul>
                     <div className="text-xs text-slate-400 border-l-2 border-slate-600 pl-3 mt-2">
                        <strong>Research Basis:</strong> "Effort-Seconds" is a practical abstraction similar to scientific metrics like <em>TRIMP (Training Impulse)</em> or <em>EPOC (Excess Post-exercise Oxygen Consumption)</em>, which quantify total physiological stress. The hiking economy bonus is based on studies showing a clear crossover point where hiking becomes more metabolically efficient than running on steep inclines, thus preserving the "engine" for later.
                    </div>
                    
                    <h6>B. Muscular Damage (The "Chassis")</h6>
                    <p>This represents the physical breakdown of muscle fibers, which is often the true limiter in long mountain races.</p>
                     <ul className="!my-2">
                        <li><strong>How it's tracked:</strong> A <code>Muscular Damage Score</code> accumulates throughout the race. Each segment adds to this score based on a weighted <code>Damage Coefficient</code>.</li>
                        <li><strong>The Key Factor:</strong> The coefficient is highest for steep downhill running (3.0x), moderate for running uphill (1.0x), and lowest for hiking (0.2x). This is a critical and deliberate feature of the model.</li>
                    </ul>
                     <div className="text-xs text-slate-400 border-l-2 border-slate-600 pl-3 mt-2">
                        <strong>Research Basis:</strong> The asymmetrical weighting is due to <strong>eccentric muscle contractions</strong>. When your quadriceps act as brakes during downhill running, the muscle lengthens under a heavy load. This type of contraction is scientifically proven to be the primary cause of the micro-tears that lead to significant muscle damage, inflammation, and Delayed Onset Muscle Soreness (DOMS).
                    </div>

                    <h5>3. The Interaction: How The Chassis Breaks The Engine</h5>
                    <p>Here's the most important insight: <strong>accumulated muscular damage makes you less metabolically efficient.</strong> As your muscles break down, your biomechanics falter, and it takes more energy to run at the same pace. The planner models this with a dynamic feedback loop:</p>
                    <p className="text-center font-mono bg-slate-800 p-2 rounded-md text-accent text-sm">Effective Fatigue % = Base Fade % * (1 + Damage Score * Resilience)</p>
                    <p>This means as your legs get trashed from downhills, your metabolic fatigue rate spirals upwards. The <strong>Muscular Resilience</strong> profile setting controls how quickly this happens. This accurately models why preserving your legs early is the key to finishing strong.</p>
                    <div className="text-xs text-slate-400 border-l-2 border-slate-600 pl-3 mt-2">
                        <strong>Research Basis:</strong> This interaction is based on the concept of <strong>running economy</strong>. Studies have shown that muscle damage and fatigue lead to a measurable increase in oxygen consumption (VO2) at a given running speed, indicating a decline in efficiency. The formula is a direct model of this physiological reality.
                    </div>
                    
                    <h5>4. Sleep, Recovery, and Psychology</h5>
                    <ul className="!my-2">
                        <li><strong>Differentiated Sleep Recovery:</strong> A sleep stop provides a non-linear "reset" to your fatigue. It is highly effective at clearing <em>metabolic</em> fatigue (reducing CNS fatigue, clearing byproducts) but much less effective at repairing real <em>muscular</em> damage, which is a much slower biological process.</li>
                        <li><strong>Finish Line Pull:</strong> A small factor is applied in the final 10% of the race, slightly reducing fatigue effects to model a final psychological "kick."</li>
                    </ul>
                </div>
            )}
            
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
                <Button onClick={onClose} variant="primary">Got it, let's start planning!</Button>
            </div>
        </Modal>
    );
};
