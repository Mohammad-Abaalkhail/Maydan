import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import StatusToastContainer from '../components/StatusToast';

function GameRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [diceRoll, setDiceRoll] = useState(null);
  const [winner, setWinner] = useState(null);
  
  const hasVotedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchRoom();
    setupSocketListeners();

    return () => {
      if (socket) {
        socket.off('room:updated');
        socket.off('room:started');
        socket.off('game:state');
        socket.off('turn:answer-submitted');
        socket.off('vote:phase-started');
        socket.off('vote:update');
        socket.off('vote:result');
        socket.off('game:end');
      }
    };
  }, [user, socket, roomId, navigate]);

  const fetchRoom = async () => {
    try {
      const response = await api.get(`/api/rooms/${roomId}`);
      setRoom(response.data.room);
    } catch (error) {
      console.error('Error fetching room:', error);
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('room:updated', (data) => {
      setRoom(data.room);
    });

    socket.on('room:started', (data) => {
      setRoom(data.room);
      setGameState(data.gameState);
      setPlayerHand(data.playerHands[user.id] || []);
      addToast('بدأت اللعبة!', 'success');
    });

    socket.on('game:state', (data) => {
      setGameState(data.gameState);
      if (data.powerCardUsed) {
        addToast(data.powerCardUsed.message, 'info');
      }
    });

    socket.on('turn:answer-submitted', (data) => {
      addToast(`تم تقديم إجابة من ${getPlayerName(data.playerId)}`, 'info');
    });

    socket.on('vote:phase-started', () => {
      hasVotedRef.current = false;
      setVotes({});
    });

    socket.on('vote:update', (data) => {
      setVotes(data.votes);
      if (data.doubleVote) {
        addToast('تم تطبيق التصويت المزدوج!', 'info');
      }
    });

    socket.on('vote:result', (data) => {
      if (data.accepted) {
        addToast('تم قبول الإجابة!', 'success');
        if (data.diceRoll) {
          setDiceRoll(data.diceRoll);
          setTimeout(() => setDiceRoll(null), 3000);
        }
      } else {
        addToast('تم رفض الإجابة', 'warning');
      }
      setGameState(data.gameState);
      setCurrentAnswer('');
      hasVotedRef.current = false;
    });

    socket.on('game:end', (data) => {
      setWinner(data.winner);
      addToast(`🎉 فاز ${data.winner.username}!`, 'success');
    });
  };

  const getPlayerName = (userId) => {
    if (!room) return '';
    const player = room.playerRooms.find((pr) => pr.user.id === userId);
    return player?.user.username || '';
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStartGame = () => {
    if (!socket || !connected) {
      addToast('غير متصل بالخادم', 'error');
      return;
    }

    socket.emit('room:start', { roomId }, (response) => {
      if (!response.success) {
        addToast(response.error || 'فشل بدء اللعبة', 'error');
      }
    });
  };

  const handleSubmitAnswer = () => {
    if (!socket || !connected || !currentAnswer.trim()) {
      return;
    }

    socket.emit('turn:answer', { roomId, answer: currentAnswer }, (response) => {
      if (!response.success) {
        addToast(response.error || 'فشل تقديم الإجابة', 'error');
      }
    });
  };

  const handleVote = (vote) => {
    if (!socket || !connected || hasVotedRef.current) {
      return;
    }

    hasVotedRef.current = true;
    socket.emit('vote:cast', { roomId, vote }, (response) => {
      if (!response.success) {
        addToast(response.error || 'فشل التصويت', 'error');
        hasVotedRef.current = false;
      } else if (response.gameEnded) {
        // Game ended, handled by game:end event
      }
    });
  };

  const handleUsePowerCard = (type) => {
    if (!socket || !connected) {
      addToast('غير متصل بالخادم', 'error');
      return;
    }

    socket.emit('power:use', { roomId, type }, (response) => {
      if (!response.success) {
        addToast(response.error || 'فشل استخدام بطاقة القوة', 'error');
      }
    });
  };

  const handleLeaveRoom = () => {
    if (socket && connected) {
      socket.emit('room:leave', { roomId }, () => {
        navigate('/lobby');
      });
    } else {
      navigate('/lobby');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">الغرفة غير موجودة</div>
      </div>
    );
  }

  const isHost = room.hostId === user.id;
  const currentPlayer = room.playerRooms.find((pr) => pr.user.id === user.id);
  const isMyTurn = gameState?.currentTurn?.playerId === user.id;
  const isVotingPhase = gameState?.currentTurn?.phase === 'voting';
  const canAnswer = isMyTurn && gameState?.currentTurn?.phase === 'answering';
  const canVote = !isMyTurn && isVotingPhase && !hasVotedRef.current;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <StatusToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white rounded-xl shadow-lg p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الغرفة: {room.code}</h1>
            <p className="text-gray-600 text-sm">
              {connected ? '● متصل' : '● غير متصل'} |{' '}
              {room.state === 'lobby' ? 'في الانتظار' : room.state === 'playing' ? 'قيد اللعب' : 'انتهت'}
            </p>
          </div>
          <button
            onClick={handleLeaveRoom}
            aria-label="مغادرة الغرفة"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            مغادرة الغرفة
          </button>
        </div>
      </div>

      {/* Winner Panel */}
      {winner && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 text-center">
            <h2 className="text-3xl font-bold text-yellow-900 mb-2">🎉 الفائز!</h2>
            <p className="text-xl text-yellow-900 font-semibold">{winner.username}</p>
            <p className="text-gray-700 mt-2">النقاط: {winner.progress}</p>
          </div>
        </div>
      )}

      {/* Dice Roll Display */}
      {diceRoll && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-800">🎲 النرد: {diceRoll}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-4">
        {/* Left Column - Players */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">اللاعبون</h2>
            <div className="space-y-2">
              {room.playerRooms.map((playerRoom) => {
                const isCurrentTurn = gameState?.currentTurn?.playerId === playerRoom.user.id;
                return (
                  <div
                    key={playerRoom.id}
                    className={`p-3 rounded-lg border-2 ${
                      isCurrentTurn
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">
                          {playerRoom.user.username}
                          {isCurrentTurn && ' 👈'}
                        </p>
                        <p className="text-sm text-gray-600">
                          النقاط: {playerRoom.progress} / {room.roundGoal}
                        </p>
                      </div>
                      {playerRoom.isReady && (
                        <span className="text-green-600 text-sm">✓ جاهز</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Game Button (Host Only) */}
          {isHost && room.state === 'lobby' && (
            <button
              onClick={handleStartGame}
              disabled={room.playerRooms.length < 3 || !connected}
              aria-label={room.playerRooms.length < 3 ? 'عدد اللاعبين غير كافٍ' : 'بدء اللعبة'}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {room.playerRooms.length < 3
                ? `عدد اللاعبين غير كافٍ (${room.playerRooms.length}/3)`
                : 'بدء اللعبة'}
            </button>
          )}

          {/* Power Cards (During Own Turn) */}
          {canAnswer && room.state === 'playing' && (
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800">بطاقات القوة</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleUsePowerCard('Skip')}
                  aria-label="استخدام بطاقة تخطي الدور"
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  تخطي الدور
                </button>
                <button
                  onClick={() => handleUsePowerCard('DoubleVote')}
                  aria-label="استخدام بطاقة التصويت المزدوج"
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  تصويت مزدوج
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Column - Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Question */}
          {gameState?.currentQuestion && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">السؤال</h2>
              <p className="text-lg text-gray-700">{gameState.currentQuestion.textAr}</p>
            </div>
          )}

          {/* Answer Input (My Turn) */}
          {canAnswer && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">إجابتك</h2>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                aria-label="إجابتك"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[100px]"
                rows={4}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim()}
                aria-label="تقديم الإجابة"
                className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                تقديم الإجابة
              </button>
            </div>
          )}

          {/* Voting (Not My Turn) */}
          {canVote && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">التصويت</h2>
              {gameState?.currentAnswer && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{gameState.currentAnswer.answer}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    من: {getPlayerName(gameState.currentAnswer.playerId)}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => handleVote(true)}
                  aria-label="قبول الإجابة"
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  ✓ قبول
                </button>
                <button
                  onClick={() => handleVote(false)}
                  aria-label="رفض الإجابة"
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  ✗ رفض
                </button>
              </div>
              {/* Vote Count */}
              {Object.keys(votes).length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  الأصوات: {Object.values(votes).filter((v) => v).length} قبول /{' '}
                  {Object.values(votes).filter((v) => !v).length} رفض
                </div>
              )}
            </div>
          )}

          {/* Player Hand */}
          {playerHand.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">بطاقاتك</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {playerHand.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-300 rounded-lg p-4 text-center min-h-[120px] flex items-center justify-center"
                  >
                    <p className="text-sm font-medium text-gray-800">{card.textAr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting State */}
          {room.state === 'lobby' && (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <p className="text-lg text-gray-600">في انتظار بدء اللعبة...</p>
              {isHost && (
                <p className="text-sm text-gray-500 mt-2">
                  يجب أن يكون هناك 3 لاعبين على الأقل لبدء اللعبة
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameRoom;

