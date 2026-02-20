import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { IntroScreen } from './screens/IntroScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { Header } from './components/Header';
import { useGameState } from './hooks/useGameState';
import type { PetType } from './types/game';
import { LeaderboardScreen } from './screens/LeaderboardScreen';

type Screen = 'intro' | 'leaderboard' | 'auth' | 'start' | 'game';

function App() {
    const { ready, authenticated } = usePrivy();
    // If already authenticated on load (e.g. after OAuth redirect), skip intro
    const [currentScreen, setCurrentScreen] = useState<Screen>(
        (ready && authenticated) ? 'auth' : 'intro'
    );
    const { gameState, startGame, resetGame, performAction, handleEvaluation, updateCoins, isLoading } = useGameState();

    // Effect to handle navigation based on auth and game state
    useEffect(() => {
        if (!ready || isLoading) return;

        if (currentScreen === 'intro' || currentScreen === 'leaderboard') {
            return;
        }

        if (authenticated) {
            if (gameState) {
                // If authenticated and has save data, go to game
                setCurrentScreen('game');
            } else if (currentScreen !== 'game') {
                // If authenticated but no save data, go to start (create pet)
                setCurrentScreen('start');
            }
        } else {
            // If not authenticated and not in intro, go to auth
            if (currentScreen !== 'auth') {
                setCurrentScreen('auth');
            }
        }
    }, [ready, authenticated, gameState, currentScreen]);

    // Handlers
    const handleIntroComplete = () => {
        setCurrentScreen('leaderboard');
    };

    const handlePlayFromLeaderboard = () => {
        if (!authenticated) {
            setCurrentScreen('auth');
        } else if (gameState) {
            setCurrentScreen('game');
        } else {
            setCurrentScreen('start');
        }
    };

    const handleStartGame = async (petName: string, ownerName: string, petType: PetType) => {
        await startGame(petName, ownerName, petType);
        setCurrentScreen('game');
    };

    const handleReset = async () => {
        await resetGame();
        setCurrentScreen('start');
    };

    const handleAction = (action: 'eat' | 'play' | 'train') => {
        performAction(action);
    };

    if (!ready || (authenticated && isLoading)) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#212529',
                color: '#fff',
                fontFamily: '"Press Start 2P"',
                fontSize: '24px'
            }}>
                LOADING CARTRIDGE...
            </div>
        );
    }

    return (
        <>
            {currentScreen !== 'intro' && <Header />}

            {currentScreen === 'intro' && (
                <IntroScreen onComplete={handleIntroComplete} />
            )}

            {currentScreen === 'leaderboard' && (
                <LeaderboardScreen
                    onPlayClick={handlePlayFromLeaderboard}
                    gameState={gameState}
                />
            )}

            {currentScreen === 'auth' && (
                <LoginScreen />
            )}

            {currentScreen === 'start' && (
                <StartScreen onStart={handleStartGame} />
            )}

            {currentScreen === 'game' && gameState && (
                <GameScreen
                    gameState={gameState}
                    onAction={handleAction}
                    onEvaluation={handleEvaluation}
                    onReset={handleReset}
                    onCoinsUpdate={updateCoins}
                />
            )}
        </>
    );
}

export default App;
