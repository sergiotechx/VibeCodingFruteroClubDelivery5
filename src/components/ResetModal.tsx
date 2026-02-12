import './ResetModal.css';

interface ResetModalProps {
    isOpen: boolean;
    petName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ResetModal({ isOpen, petName, onConfirm, onCancel }: ResetModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="nes-container is-dark with-title modal-container">
                    <p className="title">⚠️ RESET CARTRIDGE</p>

                    <div className="modal-body">
                        <div className="warning-icon">♻️</div>

                        <p className="modal-message">
                            You are about to reset your cartridge!
                        </p>

                        <div className="nes-container is-rounded warning-box">
                            <p className="warning-text">
                                <strong>{petName}</strong> and all progress will be lost forever.
                            </p>
                        </div>

                        <p className="confirmation-text">
                            Are you sure you want to continue?
                        </p>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="nes-btn action-btn-modal"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className="nes-btn is-error action-btn-modal"
                            onClick={onConfirm}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
