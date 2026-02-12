import { useState } from 'react';
import { IntroScreen } from './screens/IntroScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { useGameState } from './hooks/useGameState';
import type { PetType } from './types/game';

type Screen = 'intro' | 'start' | 'game';

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
    const { gameState, startGame, resetGame, increaseStat } = useGameState();

    // If game state exists, skip to game screen
    if (gameState && currentScreen !== 'game') {
        setCurrentScreen('game');
    }

    const handleIntroComplete = () => {
        setCurrentScreen('start');
    };

    const handleStartGame = (petName: string, petType: PetType) => {
        startGame(petName, petType);
        setCurrentScreen('game');
    };

    const handleReset = () => {
        resetGame();
        setCurrentScreen('start');
    };

    const handleIncreaseStat = (stat: 'hunger' | 'happiness' | 'energy') => {
        increaseStat(stat, 20);
    };

    return (
        <>
            {currentScreen === 'intro' && (
                <IntroScreen onComplete={handleIntroComplete} />
            )}

            {currentScreen === 'start' && (
                <StartScreen onStart={handleStartGame} />
            )}

            {currentScreen === 'game' && gameState && (
                <GameScreen
                    gameState={gameState}
                    onIncreaseStat={handleIncreaseStat}
                    onReset={handleReset}
                />
            )}
        </>
    );
}

export default App;
