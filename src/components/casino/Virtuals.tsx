import React, {useEffect, useState} from 'react';
import Header from "../../header/header";
import Footer from "../../footer/footer";
import makeRequest from "../../utils/fetch-request";
import {LazyLoadImage} from 'react-lazy-load-image-component';
import {Link} from "react-router-dom";
import SideBar from "../../sidebar/awesome/Sidebar";
import {getFromLocalStorage, setLocalStorage} from "../../utils/local-storage";
import Notify from "../../utils/Notify";

const Casino = (props) => {

    const [user] = useState(getFromLocalStorage("user"));

    const [categories, setCategories] = useState([])

    const [games, setGames] = useState([])

    const fetchGames = async (category = 'rgs-vsb') => {
        let endpoint = "/v1/casino-games?game-type-id=" + category
        let method = "GET"
        await makeRequest({url: endpoint, method: method}).then(([status, result]) => {
            if (status == 200) {
                setCategories(result.types)
                setGames(result.data)
                setLocalStorage('category_games', result.data)
            }
        });
    }

    const getCategoryGames = (category) => {
        setGames([])
        fetchGames(category?.game_type_id)
    }

    const showLoginNotification = () => {
        let message = {
            status: 500,
            message: "Please Log In to continue."
        }
        Notify(message)
    }

    const launchGame = (game_id) => {

        const userState = (getFromLocalStorage("user"));

        if (userState?.token) {
            return window.location.href = `/virtuals/launch/${game_id}?live=1`
        }

        return showLoginNotification()
    }

    useEffect(() => {
        fetchGames()
    }, [])

    return (
        <>
        <h1>Virtuals play</h1>
        <div className="col-md-12 d-flex flex-column">
            <div className="col-md-12">
                <div className="game-categories shadow-sm  p-2 shadow-sm casino-category-container">
                    <button
                        className={`cursor-pointer text-center casino-category`}
                        autoFocus
                        onClick={() => getCategoryGames('rgs-vsb')}>
                        Virtual Games
                    </button>
                </div>
            </div>
            <div className="col">
                <div className={'row  p-2 m-1'}>
                    {games?.map((game) => (
                            <div onClick={() => launchGame(game.game_id)}
                                    className="col-md-2 mt-1 d-flex flex-column shadow-sm"
                                    key={game.game_id}>
                                <LazyLoadImage src={`${game.game_icon}`}
                                    alt={game.gamw_name}
                                                className={'virtual-game-image'}/>
                                <p className={'p-2 bold'}>{game.game_name}</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
        </>
    )

}


export default Casino;
