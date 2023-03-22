import styles from './index.module.css';

export const OnlineState = (props: { onlineUserAmount: number }) => {
    return (
        <button className={styles.button}>
            <span>{props.onlineUserAmount} ONLINE</span>
            <i></i>
        </button>
    );
};
