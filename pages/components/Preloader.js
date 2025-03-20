import HashLoader from "react-spinners/HashLoader";

const Preloader = () => {

    return (<>
        <div className="loader flex h-screen w-full overflow-hidden justify-center items-center z-50">
            <div className="loader-overlay">
                <HashLoader color="#3498db" size={80} />
            </div>
        </div>
    </>);
};

export default Preloader;
