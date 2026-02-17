import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { IntroScreen } from './screens/IntroScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { Header } from './components/Header';
import { useGameState } from './hooks/useGameState';
import type { PetType } from './types/game';

type Screen = 'intro' | 'auth' | 'start' | 'game';

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
    const { gameState, startGame, resetGame, performAction, handleEvaluation, isLoading } = useGameState();
    const { ready, authenticated } = usePrivy();

    // Effect to handle navigation based on auth and game state
    useEffect(() => {
        if (!ready || isLoading) return;

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
            if (currentScreen !== 'intro') {
                setCurrentScreen('auth');
            }
        }
    }, [ready, authenticated, gameState, currentScreen, isLoading]);

    const handleIntroComplete = () => {
        if (authenticated) {
            setCurrentScreen(gameState ? 'game' : 'start');
        } else {
            setCurrentScreen('auth');
        }
    };

    const handleStartGame = (petName: string, petType: PetType) => {
        startGame(petName, petType);
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
                />
            )}
        </>
    );
}

export default App;
