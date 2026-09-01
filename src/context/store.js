import { createContext, useContext, useReducer, useMemo } from "react";
import Reducer from './reducer'


const initialState = {
    error: null,
    // user:localStorage.getItem('auth_token')
};

export const DispatchContext = createContext(() => { });

const Store = ({ children }) => {
    const [state, dispatch] = useReducer(Reducer, initialState);
    const contextValue = useMemo(() => [state, dispatch], [state, dispatch]);

    return (
        <DispatchContext.Provider value={dispatch}>
            <Context.Provider value={contextValue}>
                {children}
            </Context.Provider>
        </DispatchContext.Provider>
    )
};

export const Context = createContext(initialState);
export const useAppDispatch = () => useContext(DispatchContext);
export default Store;
