
import React, { useState, useEffect } from 'react';
import { User, BoardTask, ArduinoBoard, ViewState, Comment, Message } from './types';
import { ARDUINO_BOARDS } from './constants';
import { storage } from './services/storage';
import { getBoardInsights } from './services/geminiService';

// Main Application Components
const Navbar = ({ user, currentView, onViewChange, onLogout }: { 
  user: User | null, 
  currentView: ViewState,
  onViewChange: (v: ViewState) => void,
  onLogout: () => void 
}) => (
  <nav className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => user ? onViewChange('COMMON_PAGE') : onViewChange('WELCOME')}>
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-indigo-700 font-bold">A</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">AERVIX</h1>
        </div>
        
        {user && (
          <div className="hidden md:flex space-x-4">
            <button 
              onClick={() => onViewChange('COMMON_PAGE')} 
              className={`px-3 py-1 rounded-md transition ${['COMMON_PAGE', 'BOARD_LIST', 'BOARD_DETAILS'].includes(currentView) ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
            >
              Learn
            </button>
            <button 
              onClick={() => onViewChange('COMMUNITY')} 
              className={`px-3 py-1 rounded-md transition ${currentView === 'COMMUNITY' ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
            >
              Community
            </button>
            <button 
              onClick={() => onViewChange('INBOX')} 
              className={`px-3 py-1 rounded-md transition ${currentView === 'INBOX' ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
            >
              Inbox
            </button>
          </div>
        )}
      </div>

      {user ? (
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition"
            onClick={() => onViewChange('PROFILE')}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 overflow-hidden border-2 border-white/20">
              {user.profileImage ? (
                <img src={user.profileImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>
              )}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
          </div>
          <button 
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-x-2">
          <button onClick={() => onViewChange('AUTH_LOGIN')} className="text-sm font-medium hover:text-indigo-200">Login</button>
          <button onClick={() => onViewChange('AUTH_REGISTER')} className="bg-white text-indigo-700 px-3 py-1 rounded-md text-sm font-bold shadow-sm">Join</button>
        </div>
      )}
    </div>
  </nav>
);

export default function App() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<ArduinoBoard | null>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [communityTasks, setCommunityTasks] = useState<BoardTask[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Registration Form State
  const [regData, setRegData] = useState({ name: '', department: '', email: '', password: '', profileImage: '' });
  const [loginData, setLoginData] = useState({ nameOrEmail: '', password: '' });
  
  // New Task State
  const [newTask, setNewTask] = useState({ taskName: '', codeUsed: '', referenceUrl: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Gemini Tips
  const [boardTips, setBoardTips] = useState<string | null>(null);

  // Community Search and Comments
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState<{ [taskId: string]: string }>({});

  // Inbox State
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [newMessageText, setNewMessageText] = useState('');

  useEffect(() => {
    if (currentUser) {
      setTasks(storage.getTasks(currentUser.id));
      setMessages(storage.getMessages(currentUser.id));
    }
    setAllUsers(storage.getUsers());
    if (view === 'COMMUNITY') {
      setCommunityTasks(storage.getAllTasks());
    }
  }, [currentUser, view]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.email || !regData.password) return alert("Please fill all fields");
    const newUser: User = { id: Date.now().toString(), ...regData };
    storage.saveUser(newUser);
    alert("Account created! Please log in.");
    setView('AUTH_LOGIN');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = storage.getUsers();
    const user = users.find(u => (u.name === loginData.nameOrEmail || u.email === loginData.nameOrEmail) && u.password === loginData.password);
    if (user) { setCurrentUser(user); setView('COMMON_PAGE'); } else { alert("Invalid credentials"); }
  };

  const handleLogout = () => { setCurrentUser(null); setView('WELCOME'); };

  const selectBoard = async (board: ArduinoBoard) => {
    setSelectedBoard(board); setView('BOARD_DETAILS'); setBoardTips(null);
    const tips = await getBoardInsights(board.name);
    setBoardTips(tips);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedBoard) return;
    setIsUploading(true);
    const task: BoardTask = {
      id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name, userProfile: currentUser.profileImage,
      boardId: selectedBoard.id, taskName: newTask.taskName, codeUsed: newTask.codeUsed, referenceUrl: newTask.referenceUrl,
      circuitDesignImage: imagePreview || undefined, timestamp: Date.now(), comments: []
    };
    setTimeout(() => {
      storage.saveTask(currentUser.id, task);
      setTasks(storage.getTasks(currentUser.id));
      setNewTask({ taskName: '', codeUsed: '', referenceUrl: '' });
      setImagePreview(null); setIsUploading(false);
      alert("Task submitted!");
    }, 800);
  };

  const submitComment = (task: BoardTask) => {
    if (!currentUser || !commentText[task.id]) return;
    const comment: Comment = {
      id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name,
      userProfile: currentUser.profileImage, text: commentText[task.id], timestamp: Date.now()
    };
    storage.addComment(task.userId, task.id, comment);
    setCommentText({ ...commentText, [task.id]: '' });
    setCommunityTasks(storage.getAllTasks());
  };

  const sendMessage = () => {
    if (!currentUser || !selectedChatUser || !newMessageText) return;
    const msg: Message = {
      id: Date.now().toString(), fromUserId: currentUser.id, fromUserName: currentUser.name,
      toUserId: selectedChatUser.id, text: newMessageText, timestamp: Date.now()
    };
    storage.sendMessage(msg);
    setMessages([...messages, msg]);
    setNewMessageText('');
  };

  const downloadPDF = () => {
    if (!currentUser) return;
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(67, 56, 202);
    doc.text("AERVIX ELECTRONICS CLUB", 20, 20);
    doc.setFontSize(14); doc.setTextColor(50, 50, 50);
    doc.text(`Progress Report: ${currentUser.name}`, 20, 30);
    doc.text(`Department: ${currentUser.department}`, 20, 38);
    doc.line(20, 42, 190, 42);
    let y = 55;
    tasks.forEach((task, index) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${task.taskName}`, 20, y);
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      doc.text(`Board: ${task.boardId} | ${new Date(task.timestamp).toLocaleDateString()}`, 20, y + 6);
      const splitCode = doc.splitTextToSize(task.codeUsed, 160);
      doc.setFont("courier"); doc.text(splitCode, 25, y + 15);
      y += 15 + (splitCode.length * 4) + 10;
    });
    doc.save(`AERVIX_${currentUser.name}.pdf`);
  };

  const filteredPeople = allUsers.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar user={currentUser} currentView={view} onViewChange={setView} onLogout={handleLogout} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        
        {/* WELCOME VIEW */}
        {view === 'WELCOME' && (
          <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-indigo-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 opacity-40"></div>
             <div className="relative z-10 p-8">
              <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">Connect. Build. <span className="text-indigo-600">Innovate.</span></h2>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                AERVIX is more than a hub—it's a community of engineers pushing boundaries. 
                Document your progress, share your circuits, and learn together.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <button onClick={() => setView('AUTH_REGISTER')} className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-200">Join the Club</button>
                <button onClick={() => setView('AUTH_LOGIN')} className="w-full sm:w-auto bg-white text-indigo-600 border-2 border-indigo-600 px-12 py-5 rounded-full font-bold text-xl hover:bg-indigo-50 transition">Member Portal</button>
              </div>
             </div>
          </div>
        )}

        {/* REG/LOGIN Views remain largely the same, focused on profiles */}
        {(view === 'AUTH_REGISTER' || view === 'AUTH_LOGIN') && (
           <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
              {view === 'AUTH_REGISTER' ? (
                <>
                  <h3 className="text-3xl font-black text-slate-900 mb-8">Club Registration</h3>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex justify-center mb-6">
                      <div className="relative group cursor-pointer w-28 h-28">
                        <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                          {regData.profileImage ? <img src={regData.profileImage} className="w-full h-full object-cover" /> : <svg className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageFile(e, (s) => setRegData({...regData, profileImage: s}))} />
                      </div>
                    </div>
                    <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} required />
                    <input type="text" placeholder="Department (e.g. Mechanical)" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} required />
                    <input type="email" placeholder="Club Email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-lg transition">Apply Now</button>
                  </form>
                  <p className="mt-8 text-center text-slate-500 font-medium">Already a member? <button onClick={() => setView('AUTH_LOGIN')} className="text-indigo-600 font-bold">Sign In</button></p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-black text-slate-900 mb-8">Sign In</h3>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input type="text" placeholder="Email or Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.nameOrEmail} onChange={e => setLoginData({...loginData, nameOrEmail: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-lg transition">Enter Hub</button>
                  </form>
                  <p className="mt-8 text-center text-slate-500 font-medium">New member? <button onClick={() => setView('AUTH_REGISTER')} className="text-indigo-600 font-bold">Register</button></p>
                </>
              )}
           </div>
        )}

        {/* COMMUNITY VIEW with LinkedIn Style Search and Comments */}
        {view === 'COMMUNITY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Search People */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h4 className="font-black text-slate-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Search Club Members
                </h4>
                <input 
                  type="text" 
                  placeholder="Find by name or dept..." 
                  className="w-full p-3 bg-slate-50 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPeople.map(person => (
                    <div key={person.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden border">
                          {person.profileImage ? <img src={person.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-indigo-400">{person.name.charAt(0)}</div>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{person.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{person.department}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedChatUser(person); setView('INBOX'); }}
                        className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-8 space-y-8">
              {communityTasks.map(task => (
                <div key={task.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center space-x-3">
                         <div className="w-12 h-12 rounded-full border-2 border-indigo-50 overflow-hidden shadow-sm">
                           {task.userProfile ? <img src={task.userProfile} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-300">{task.userName.charAt(0)}</div>}
                         </div>
                         <div>
                            <h5 className="font-black text-slate-900 leading-none">{task.userName}</h5>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{new Date(task.timestamp).toLocaleString()}</p>
                         </div>
                       </div>
                       <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{task.boardId}</span>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-4">
                       <h4 className="text-xl font-bold text-slate-900 mb-2">{task.taskName}</h4>
                       <pre className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto max-h-40"><code>{task.codeUsed}</code></pre>
                    </div>

                    {task.circuitDesignImage && (
                       <img src={task.circuitDesignImage} className="w-full rounded-2xl mb-4 shadow-lg border" alt="Circuit" />
                    )}
                    
                    <div className="flex items-center space-x-6 border-t pt-4">
                       <div className="flex items-center text-slate-400 text-sm font-bold">
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                          {task.comments?.length || 0} Comments
                       </div>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4 space-y-3">
                       {task.comments?.map(comment => (
                          <div key={comment.id} className="flex space-x-3 bg-slate-50 p-3 rounded-2xl">
                             <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                {comment.userProfile ? <img src={comment.userProfile} className="w-full h-full object-cover" /> : <div className="bg-indigo-100 w-full h-full flex items-center justify-center text-[10px] font-bold text-indigo-400">{comment.userName.charAt(0)}</div>}
                             </div>
                             <div className="flex-grow">
                                <p className="text-xs font-black text-slate-900">{comment.userName}</p>
                                <p className="text-sm text-slate-600 mt-1">{comment.text}</p>
                             </div>
                          </div>
                       ))}
                       <div className="flex space-x-2 mt-4">
                          <input 
                            type="text" 
                            placeholder="Add a comment..." 
                            className="flex-grow p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={commentText[task.id] || ''}
                            onChange={e => setCommentText({...commentText, [task.id]: e.target.value})}
                          />
                          <button 
                            onClick={() => submitComment(task)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                          >
                            Post
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INBOX VIEW */}
        {view === 'INBOX' && currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white rounded-[2.5rem] shadow-xl border overflow-hidden min-h-[600px]">
             {/* Conversations Sidebar */}
             <div className="md:col-span-4 border-r border-slate-100 flex flex-col h-full">
                <div className="p-6 border-b">
                   <h3 className="text-2xl font-black text-slate-900">Messages</h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                   {allUsers.filter(u => u.id !== currentUser.id).map(user => (
                      <div 
                        key={user.id} 
                        onClick={() => setSelectedChatUser(user)}
                        className={`p-4 flex items-center space-x-3 cursor-pointer transition ${selectedChatUser?.id === user.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                      >
                         <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border">
                            {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{user.name.charAt(0)}</div>}
                         </div>
                         <div className="flex-grow">
                            <h5 className="font-bold text-slate-900">{user.name}</h5>
                            <p className="text-xs text-slate-400 truncate">{user.department}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Chat Window */}
             <div className="md:col-span-8 flex flex-col h-full">
                {selectedChatUser ? (
                  <>
                    <div className="p-6 border-b flex items-center space-x-4 bg-slate-50/50">
                       <div className="w-10 h-10 rounded-full overflow-hidden border">
                          {selectedChatUser.profileImage ? <img src={selectedChatUser.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-400">{selectedChatUser.name.charAt(0)}</div>}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 leading-none">{selectedChatUser.name}</h4>
                          <span className="text-[10px] font-bold text-green-500 uppercase">Active Now</span>
                       </div>
                    </div>
                    <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/20">
                       {messages.filter(m => (m.fromUserId === selectedChatUser.id && m.toUserId === currentUser.id) || (m.fromUserId === currentUser.id && m.toUserId === selectedChatUser.id))
                        .map(m => (
                          <div key={m.id} className={`flex ${m.fromUserId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-medium ${m.fromUserId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
                                {m.text}
                                <p className={`text-[10px] mt-1 ${m.fromUserId === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="p-6 border-t bg-white">
                       <div className="flex space-x-3">
                          <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-grow p-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newMessageText}
                            onChange={e => setNewMessageText(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                          />
                          <button 
                            onClick={sendMessage}
                            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
                          >
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                          </button>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                    <svg className="w-24 h-24 mb-4 opacity-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                    <h4 className="text-xl font-black text-slate-400">Select a contact to start chatting</h4>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Existing Board List, Details, and Profile views remain integrated with updated styling... */}
        {(['COMMON_PAGE', 'BOARD_LIST', 'BOARD_DETAILS', 'PROFILE'].includes(view)) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ... Rest of the existing UI rendering logic (BoardList, BoardDetails, etc.) ... */}
            {view === 'COMMON_PAGE' && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 relative">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Workspace Dashboard</h2>
                <p className="text-slate-500 mb-12 font-medium">Engineer your legacy, one board at a time.</p>
                <div className="flex flex-wrap justify-center gap-6">
                  <button onClick={() => setView('BOARD_LIST')} className="group bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center space-x-3">
                    <span>EXPLORE BOARDS</span>
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                  <button onClick={() => setView('COMMUNITY')} className="bg-white text-slate-700 border-2 border-slate-100 px-10 py-5 rounded-3xl font-black text-xl hover:border-indigo-600 hover:text-indigo-600 transition flex items-center space-x-3">
                    <span>COMMUNITY HUB</span>
                  </button>
                </div>
              </div>
            )}

            {view === 'BOARD_LIST' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ARDUINO_BOARDS.map(board => (
                  <div key={board.id} className="bg-white rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border shadow-sm" onClick={() => selectBoard(board)}>
                    <div className="h-60 overflow-hidden relative">
                      <img src={board.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={board.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8"><h4 className="text-3xl font-black text-white">{board.name}</h4></div>
                    </div>
                    <div className="p-8">
                      <p className="text-slate-500 font-medium mb-6 leading-relaxed">{board.description}</p>
                      <button className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black group-hover:bg-indigo-600 group-hover:text-white transition">Get Started</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'BOARD_DETAILS' && selectedBoard && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border shadow-sm">
                      <img src={selectedBoard.image} className="w-full h-44 object-cover rounded-2xl mb-6 shadow-md" alt={selectedBoard.name} />
                      <h3 className="text-2xl font-black text-slate-900 mb-6">{selectedBoard.name}</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedBoard.specs).map(([k,v]) => (
                          <div key={k} className="flex justify-between items-center border-b border-slate-50 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k}</span>
                             <span className="text-sm font-bold text-slate-800">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
                       <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-75">AI Assistant Tips</h4>
                       <p className="italic font-medium text-sm leading-relaxed">{boardTips || "Loading insights..."}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-10 rounded-3xl border shadow-sm">
                       <h4 className="text-2xl font-black text-slate-900 mb-8">Log Hardware Project</h4>
                       <form onSubmit={submitTask} className="space-y-6">
                          <input type="text" placeholder="Project Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newTask.taskName} onChange={e => setNewTask({...newTask, taskName: e.target.value})} required />
                          <textarea placeholder="Paste Arduino Code..." className="w-full p-4 bg-slate-900 text-indigo-300 font-mono text-xs rounded-2xl outline-none h-48 border-none" value={newTask.codeUsed} onChange={e => setNewTask({...newTask, codeUsed: e.target.value})} required />
                          <div className="grid grid-cols-2 gap-4">
                             <div className="relative h-14 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-500 transition">
                                <span className="text-xs font-black text-slate-400 uppercase">{imagePreview ? 'Image Ready' : 'Upload Schematic'}</span>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageFile(e, setImagePreview)} />
                             </div>
                             <input type="url" placeholder="Documentation URL" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs outline-none" value={newTask.referenceUrl} onChange={e => setNewTask({...newTask, referenceUrl: e.target.value})} />
                          </div>
                          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">{isUploading ? 'SYNCING...' : 'PUBLISH PROJECT'}</button>
                       </form>
                    </div>
                  </div>
               </div>
            )}

            {view === 'PROFILE' && currentUser && (
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 shadow-xl">
                        {currentUser.profileImage ? <img src={currentUser.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-4xl text-indigo-300 bg-slate-50">{currentUser.name.charAt(0)}</div>}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        <input type="file" className="hidden" onChange={(e) => handleImageFile(e, (s) => setCurrentUser({...currentUser, profileImage: s}))} />
                      </label>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900">{currentUser.name}</h3>
                    <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-sm mt-2">{currentUser.department}</p>
                    <div className="mt-10 flex gap-4">
                       <button onClick={downloadPDF} className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span>Export Portfolio PDF</span>
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">A</div>
              <div>
                <h5 className="font-black text-slate-900 leading-none">AERVIX CLUB</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Innovation Lab</p>
              </div>
           </div>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Built for the future by engineers</p>
           <div className="flex space-x-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <button className="hover:text-indigo-600 transition">GitHub</button>
              <button className="hover:text-indigo-600 transition">Docs</button>
              <button className="hover:text-indigo-600 transition">Legal</button>
           </div>
        </div>
      </footer>
    </div>
  );
}
