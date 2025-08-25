
import React from 'react';
import { Modal, ModalProps } from './ui/Modal';

interface InfoModalProps extends Omit<ModalProps, 'children'> {
    children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, size, children }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
            {children}
        </Modal>
    );
};
