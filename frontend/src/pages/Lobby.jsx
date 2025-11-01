import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatusToastContainer from '../components/StatusToast';

function Lobby() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [toasts, setToasts] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds

    // Socket event listeners
    if (socket) {
      socket.on('room:created', (data) => {
        addToast('تم إنشاء الغرفة بنجاح', 'success');
        navigate(`/room/${data.room.id}`);
      });

      socket.on('room:updated', (data) => {
        fetchRooms(); // Refresh room list
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('room:created');
        socket.off('room:updated');
      }
    };
  }, [user, socket, navigate]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateRoom = async () => {
    if (!socket || !connected) {
      addToast('غير متصل بالخادم', 'error');
      return;
    }

    setCreatingRoom(true);
    socket.emit('room:create', { categoryId: null }, (response) => {
      setCreatingRoom(false);
      if (response.success) {
        navigate(`/room/${response.room.id}`);
      } else {
        addToast(response.error || 'فشل إنشاء الغرفة', 'error');
      }
    });
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) {
      addToast('أدخل رمز الغرفة', 'warning');
      return;
    }

    try {
      const response = await api.get('/api/rooms');
      const room = response.data.rooms.find((r) => r.code === roomCode.toUpperCase());
      
      if (room) {
        if (socket && connected) {
          socket.emit('room:join', { roomId: room.id }, (joinResponse) => {
            if (joinResponse.success) {
              navigate(`/room/${room.id}`);
            } else {
              addToast(joinResponse.error || 'فشل الانضمام للغرفة', 'error');
            }
          });
        } else {
          addToast('غير متصل بالخادم', 'error');
        }
      } else {
        addToast('الغرفة غير موجودة', 'error');
      }
    } catch (error) {
      addToast('خطأ في البحث عن الغرفة', 'error');
    }
  };

  const handleJoinRoom = (roomId) => {
    if (!socket || !connected) {
      addToast('غير متصل بالخادم', 'error');
      return;
    }

    socket.emit('room:join', { roomId }, (response) => {
      if (response.success) {
        navigate(`/room/${roomId}`);
      } else {
        addToast(response.error || 'فشل الانضمام للغرفة', 'error');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <StatusToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">الميدان يا حميدان</h1>
            <p className="text-gray-600">
              مرحباً، {user?.username}
              {connected ? (
                <span className="mr-2 text-green-600">● متصل</span>
              ) : (
                <span className="mr-2 text-red-600">● غير متصل</span>
              )}
            </p>
          </div>
          <button
            onClick={logout}
            aria-label="تسجيل الخروج"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Left Column - Actions */}
        <div className="md:col-span-1 space-y-4">
          {/* Create Room */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">إنشاء غرفة جديدة</h2>
            <button
              onClick={handleCreateRoom}
              disabled={creatingRoom || !connected}
              aria-label={creatingRoom ? 'جاري الإنشاء' : 'إنشاء غرفة'}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {creatingRoom ? 'جاري الإنشاء...' : 'إنشاء غرفة'}
            </button>
          </div>

          {/* Join by Code */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">الانضمام برمز</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="أدخل رمز الغرفة"
                maxLength={4}
                aria-label="رمز الغرفة"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-widest min-h-[44px]"
              />
              <button
                onClick={handleJoinByCode}
                disabled={!connected}
                aria-label="انضم إلى الغرفة"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                انضم
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Room List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">الغرف المتاحة</h2>
            
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">لا توجد غرف متاحة حالياً</p>
                <p className="text-sm mt-2">أنشئ غرفة جديدة للبدء</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-blue-600">{room.code}</span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {room.state === 'lobby' ? 'في الانتظار' : 'قيد اللعب'}
                          </span>
                        </div>
                        {room.category && (
                          <p className="text-gray-600 mb-2">{room.category.nameAr}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {room.playerCount} / {room.maxPlayers} لاعب
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinRoom(room.id);
                        }}
                        aria-label={`انضم إلى الغرفة ${room.code}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] min-w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        انضم
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;

