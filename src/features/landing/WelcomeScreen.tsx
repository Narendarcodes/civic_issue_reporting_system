import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, ChevronRight, ChevronDown, Eye, Clock, MapPin, Camera } from 'lucide-react';

export const WelcomeScreen = ({ onLogin, onRegister }: any) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });

  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.total === 'number') {
          setStats(data);
        }
      })
      .catch(console.error);
  }, []);

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F4FAF7] font-sans text-slate-800 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00A86B] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Civic Report</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600">
          <a href="#" className="text-[#00A86B]">Home</a>
          <a href="#" className="hover:text-[#00A86B] transition-colors" onClick={(e) => { e.preventDefault(); onRegister(); }}>Report Issue</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-md hover:bg-slate-200 transition-colors">
            🌐 EN <ChevronDown size={14} />
          </button>
          <button onClick={() => navigate('/user')} className="text-slate-700 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors hover:bg-slate-50">
            Login
          </button>
          <button onClick={() => onRegister()} className="bg-[#00A86B] hover:bg-[#008f5a] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md shadow-[#00A86B]/20">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero / Timeline Section */}
      <div className="pt-12 pb-16 px-6 max-w-6xl mx-auto">
        {/* Mobile Login Buttons */}
        <div className="flex md:hidden justify-center mb-12">
          <div className="text-center flex flex-col items-center">
            <p className="text-slate-500 font-semibold mb-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 inline-block text-sm">Before login, read the flow below or skip to login 👇</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={() => navigate('/user')} className="flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#008f5a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#00A86B]/20 w-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Citizen Portal
                <ChevronRight size={18} />
              </button>
              <button onClick={() => navigate('/admin')} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm w-full">
                <Eye size={18} className="text-slate-500" />
                Admin Portal
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto relative text-center">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-[#00A86B]/20 rounded-full md:left-1/2 md:-ml-0.5" />

          {/* Step 1 */}
          <div className="relative flex flex-col md:flex-row items-start mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">1</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pr-12 text-left md:text-right">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Citizen Reports an Issue</h3>
                <p className="text-slate-600 mb-2">The citizen logs into the portal and reports a civic issue by providing:</p>
                <ul className="text-slate-500 font-medium space-y-1 text-sm inline-block text-left">
                  <li>• Issue description</li>
                  <li>• Location</li>
                  <li>• Photos/Videos (optional)</li>
                </ul>
                <p className="text-slate-600 mt-2 font-medium">The issue is published in the Community Feed.</p>
                <img src="/citizen_reporting.png" alt="Citizen reporting an issue" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
            {/* Desktop Login Buttons */}
            <div className="hidden md:flex md:w-1/2 md:pl-12 flex-col items-end pt-4">
              <p className="text-slate-500 font-semibold mb-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 inline-block text-sm">Before login, read the flow below or skip to login 👇</p>
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
                <button onClick={() => navigate('/user')} className="flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#008f5a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#00A86B]/20 w-full sm:w-auto">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Citizen Portal
                  <ChevronRight size={18} />
                </button>
                <button onClick={() => navigate('/admin')} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm w-full sm:w-auto">
                  <Eye size={18} className="text-slate-500" />
                  Admin Portal
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col md:flex-row items-start justify-end mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">2</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pl-12 text-left">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Community Voting</h3>
                <p className="text-slate-600 mb-2">Citizens living in the same area can view reported issues and upvote issues that affect them. More votes indicate that the issue impacts more people.</p>
                <p className="text-slate-600 mt-2">The system calculates a Priority Score based on:</p>
                <ul className="text-slate-500 font-medium space-y-1 text-sm inline-block">
                  <li>• Number of community votes</li>
                  <li>• Severity of the issue</li>
                  <li>• Time since the issue was reported (optional)</li>
                </ul>
                <img src="/step2_voting_1782795695974.png" alt="Community Voting" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col md:flex-row items-start mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">3</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pr-12 text-left md:text-right">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Admin Dashboard</h3>
                <p className="text-slate-600 mb-4">The admin logs into the portal and sees all reported issues in their jurisdiction. Issues are automatically sorted by Priority Score (highest priority first).</p>
                
                <div className="overflow-hidden rounded-xl border border-slate-200 text-left">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 text-left">Rank</th>
                        <th className="px-3 py-2 text-left">Issue</th>
                        <th className="px-3 py-2 text-right">Votes</th>
                        <th className="px-3 py-2 text-right">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium bg-white">
                      <tr><td className="px-3 py-2">1</td><td className="px-3 py-2">Water Pipeline Leakage</td><td className="px-3 py-2 text-right">320</td><td className="px-3 py-2 text-right text-red-500 font-bold">High</td></tr>
                      <tr><td className="px-3 py-2">2</td><td className="px-3 py-2">Road Potholes</td><td className="px-3 py-2 text-right">275</td><td className="px-3 py-2 text-right text-red-500 font-bold">High</td></tr>
                      <tr><td className="px-3 py-2">3</td><td className="px-3 py-2">Streetlight Not Working</td><td className="px-3 py-2 text-right">130</td><td className="px-3 py-2 text-right text-amber-500 font-bold">Medium</td></tr>
                      <tr><td className="px-3 py-2">4</td><td className="px-3 py-2">Garbage Collection Delay</td><td className="px-3 py-2 text-right">75</td><td className="px-3 py-2 text-right text-amber-500 font-bold">Medium</td></tr>
                      <tr><td className="px-3 py-2">5</td><td className="px-3 py-2">Broken Park Bench</td><td className="px-3 py-2 text-right">20</td><td className="px-3 py-2 text-right text-green-500 font-bold">Low</td></tr>
                    </tbody>
                  </table>
                </div>
                <img src="/step3_admin_1782795707685.png" alt="Admin Dashboard" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col md:flex-row items-start justify-end mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">4</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pl-12 text-left">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Team Assignment</h3>
                <p className="text-slate-600 mb-3">The admin assigns the highest-priority issue to the appropriate field team.</p>
                <p className="text-slate-600 font-medium">Once assigned, the issue status changes to:</p>
                <div className="mt-2 inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-bold border border-amber-200">Status: Under Progress</div>
                <img src="/step4_assignment_1782795719105.png" alt="Team Assignment" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex flex-col md:flex-row items-start mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">5</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pr-12 text-left md:text-right">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Field Team Completes the Work</h3>
                <p className="text-slate-600 mb-2">The field team resolves the issue and uploads proof of completion (photos, comments, etc.). The admin verifies the work.</p>
                <p className="text-slate-600 font-medium mt-2">The issue status remains <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-bold border border-amber-100 text-xs inline-block">Under Progress</span> until the citizen confirms.</p>
                <img src="/step5_worker_1782795729199.png" alt="Field Team Completes the Work" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="relative flex flex-col md:flex-row items-start justify-end mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">6</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pl-12 text-left">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Citizen Verification</h3>
                <p className="text-slate-600 mb-2">The citizen who reported the issue receives a notification.</p>
                <ul className="text-slate-500 font-medium space-y-1 text-sm inline-block">
                  <li>• They inspect the work.</li>
                  <li>• If satisfied, they click "Work Completed".</li>
                </ul>
                <img src="/step6_verification_1782795738607.png" alt="Citizen Verification" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="relative flex flex-col md:flex-row items-start mb-12 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">7</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pr-12 text-left md:text-right">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Issue Closure</h3>
                <p className="text-slate-600 mb-2 font-medium">The issue status changes to:</p>
                <div className="mb-2 inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold border border-emerald-200">Status: Completed</div>
                <p className="text-slate-600">The complaint is officially closed.</p>
                <img src="/step7_closure_1782795747511.png" alt="Issue Closure" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Step 8 */}
          <div className="relative flex flex-col md:flex-row items-start justify-end mb-16 group">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_8px_#F4FAF7] z-10 transform -translate-x-1/2 md:translate-x-[-50%] group-hover:scale-110 transition-transform">8</div>
            <div className="ml-16 md:ml-0 md:w-1/2 md:pl-12 text-left">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Reward & Leaderboard</h3>
                <ul className="text-slate-600 font-medium space-y-2 text-sm">
                  <li>• The reporting citizen earns reward points.</li>
                  <li>• Citizens who actively vote on genuine issues may also earn small participation points (optional).</li>
                  <li>• The leaderboard is updated to encourage community participation.</li>
                </ul>
                <img src="/step8_reward_1782795757203.png" alt="Reward & Leaderboard" className="w-full rounded-xl mt-4 object-cover border border-slate-100 shadow-sm" />
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Complete Workflow Flowchart */}
        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden mt-12 border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A86B]/10 rounded-bl-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-tr-full blur-3xl"></div>
          
          <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Complete Workflow</h3>
          <div className="inline-block text-left text-emerald-400 font-mono text-sm sm:text-base leading-loose whitespace-pre relative z-10 mx-auto">
{`Citizen Reports Issue
          │
          ▼
Issue Published in Community Feed
          │
          ▼
Citizens Vote (Upvote Priority)
          │
          ▼
Priority Score Calculated
          │
          ▼
Admin Dashboard (Issues Sorted by Priority)
          │
          ▼
Admin Assigns Field Team
          │
          ▼
Status → Under Progress
          │
          ▼
Field Team Resolves Issue
          │
          ▼
Admin Verifies Work
          │
          ▼
Citizen Confirms Completion
          │
          ▼
Status → Completed
          │
          ▼
Reward Points + Leaderboard Updated`}
          </div>
        </div>
        
      </div>

      {/* Hero Stats (Moved below CTA) */}
      <div className="py-12 bg-white border-t border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto px-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <div className="text-4xl font-black text-[#00A86B] mb-2">{stats.total}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Reports</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <div className="text-4xl font-black text-[#00A86B] mb-2">{stats.resolved}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resolved</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <div className="text-4xl font-black text-[#f05a1a] mb-2">{stats.inProgress}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">In Progress</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <div className="text-4xl font-black text-[#f59e0b] mb-2">{stats.pending}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pending</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-24 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </div>
            <h3 className="font-bold text-[#00A86B] mb-3 text-lg">Simple Reporting Form</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Quick and intuitive form to report any civic issue in just a few clicks.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <MapPin size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Location & Photo</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Add precise location and photos for accurate issue identification and tracking.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Status Tracking</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Monitor your report status from pending to resolved with live updates.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <User size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Admin Dashboard</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Comprehensive dashboard for authorities to manage and resolve issues.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <Bell size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Smart Notifications</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Get instant notifications when your reported issue status changes.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <Camera size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Before & After Proof</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Visual documentation showing the issue resolution with transparency.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Quick Response</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Automated routing ensures issues reach the right department immediately.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#00A86B]/30 transition-colors">
            <div className="w-12 h-12 bg-[#e6f7f0] text-[#00A86B] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Secure & Reliable</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Your data is protected with enterprise-grade security and privacy measures.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
