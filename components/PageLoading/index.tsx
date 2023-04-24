import styles from './index.module.css';
export const PageLoading = ({ state }: { state: boolean }) => {
    return (
        <div
            className="absolute z-10 h-screen w-screen bg-black"
            style={{ display: state ? 'flex' : 'none' }}
        >
            <div className={styles.loader}>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
                <div className={styles.loaderSquare}></div>
            </div>
        </div>
    );
};
