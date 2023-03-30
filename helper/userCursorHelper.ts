export const getViewportSize = () => {
    if ((window as any).getViewportSize) {
        return (window as any).getViewportSize;
    }

    window.onresize = () => {
        (window as any).getViewportSize = {
            width:
                window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth,
            height:
                window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight,
        };
    };

    (window as any).onresize();

    return (window as any).getViewportSize;
};

export const getScale = (x: number, y: number) => {
    const { width, height } = getViewportSize();
    return {
        scaleX: x / width,
        scaleY: y / height,
    };
};

export const getMousePosition = (scaleX: number, scaleY: number) => {
    const { width, height } = getViewportSize();
    return {
        mouseX: scaleX * width,
        mouseY: scaleY * height,
    };
};
