import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import './AboutModal.css';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    // Generate stars once
    const stars = useMemo(() =>
        Array.from({ length: 120 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
            delay: Math.random() * 4,
            duration: 1.5 + Math.random() * 3,
        })),
        []);

    if (!isOpen) return null;

    return createPortal(
        <div className="sw-overlay" onClick={onClose}>
            <div className="sw-container" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button className="sw-close-btn" onClick={onClose}>✕</button>

                {/* Stars */}
                <div className="sw-stars">
                    {stars.map(s => (
                        <div
                            key={s.id}
                            className="sw-star"
                            style={{
                                left: `${s.x}%`,
                                top: `${s.y}%`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                animationDelay: `${s.delay}s`,
                                animationDuration: `${s.duration}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Top fade gradient */}
                <div className="sw-fade" />

                {/* Crawl Area */}
                <div className="sw-perspective">
                    <div className="sw-crawl">
                        <p className="sw-episode">EPISODIO I</p>
                        <h1 className="sw-title">EL ORIGEN DEL VIBE</h1>

                        <p>
                            Es un periodo de creatividad y código.
                            Desde las montañas de <strong>MEDELLÍN, COLOMBIA</strong>,
                            un nuevo universo ha nacido, forjado con mucho
                            cariño y píxeles.
                        </p>

                        <p>
                            Este viaje no hubiera sido posible sin la guía
                            de los maestros Jedi de <strong>FRUTERO CLUB</strong> y
                            su legendario entrenamiento en <strong>VIBECODING</strong>.
                            Su sabiduría iluminó el camino para traer vida
                            a estos elementos.
                        </p>

                        <p>
                            Mientras la batalla por la diversión continúa,
                            es vital informar a la galaxia: <strong>NINGÚN ELEMON
                                FUE DAÑADO</strong> en la creación de este juego.
                            Fosforito, Charquito y sus amigos se encuentran
                            sanos y salvos, listos para su próxima aventura.
                        </p>

                        <p className="sw-vibe">
                            Que el Vibe los acompañe...
                        </p>

                        <div className="sw-image-container">
                            <img
                                src="/assets/behind_scenes.png"
                                alt="Behind the scenes"
                                className="sw-behind-img"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
