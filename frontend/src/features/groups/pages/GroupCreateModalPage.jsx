import GroupRegisterModal from "../components/GroupRegisterModal.jsx";

export default function GroupCreateModalPage({ onClose, onGroupCreated }) {
    return (
        <div>
            <GroupRegisterModal onClose={onClose} onGroupCreated={onGroupCreated} />
        </div>
    )
}