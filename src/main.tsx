import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './retro.css'
import './index.css'
import App from './App.tsx'

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

if (!privyAppId) {
    console.error('VITE_PRIVY_APP_ID is not defined in .env');
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PrivyProvider
            appId={privyAppId || ''}
            config={{
                loginMethods: ['google'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                },
                embeddedWallets: {
                    showWalletUIs: false,
                },
            }}
        >
            <App />
        </PrivyProvider>
    </StrictMode>,
)
