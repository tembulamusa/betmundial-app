import React, { useEffect, useState } from 'react';
import Header from "../../header/header";
import Footer from "../../footer/footer";
import makeRequest from "../../utils/fetch-request";
import SideBar from "../../sidebar/awesome/Sidebar";
import { getFromLocalStorage, setLocalStorage } from "../../utils/local-storage";
import Notify from "../../utils/Notify";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChair, faCircle, faDotCircle } from "@fortawesome/free-solid-svg-icons";

const LiveCasino = (props) => {

    const [dgaConnected, setDgaConnected] = useState(false)
    const [tableKeys, setTableKeys] = useState({})
    const [tableData, setTableData] = useState([])

    const [user] = useState(getFromLocalStorage("user"));

    const [categories, setCategories] = useState([])

    const [games, setGames] = useState([])

    const fetchGames = async (category = 'vs') => {
        let endpoint = "/v1/casino-games?game-type-id=" + category
        let method = "GET"
        await makeRequest({ url: endpoint, method: method }).then(([status, result]) => {
            if (status == 200) {
                setCategories(result.types)
                setGames(result.data)
                setLocalStorage('category_games', result.data)
            }
        });
    }

    const showLoginNotification = () => {
        let message = {
            status: 500,
            message: "Please Log In to continue."
        }
        Notify(message)
    }

    const launchGame = (game_id) => {

        if (user?.token) {
            return window.location.href = `/virtuals/launch/${game_id}?live=1`
        }

        return showLoginNotification()
    }

    const initializeDGAEvents = async () => {
        window.dga.onWsError = (err) => {
            setDgaConnected(false)
        }
        window.dga.onConnect = () => {
            setDgaConnected(true)
        }
        window.dga.onMessage = (data) => {
            let dataResult = []
            if (data.hasOwnProperty('tableKey')) {
                data?.tableKey?.forEach((key) => {
                    let result = {
                        id: key,
                        data: {}
                    }
                    dataResult.push(result)
                })
                setTableKeys(dataResult)
            } else {
                let localData = tableData
                let index = tableData.findIndex((item) => item.tableId == data?.tableId)
                if (index !== -1) {
                    localData[index] = data
                } else {
                    let length = localData.length
                    if (length == 0) {
                        localData[0] = data
                    } else {
                        localData[length] = data
                    }
                }
                setTableData([...localData])
            }
        }
    }

    const initializeDGA = async () => {
        try {
            let url = "prelive-dga0.pragmaticplaylive.net/ws?key=testKey&stylename=lmntgmng_betmundial";
            window.dga.connect(url)
        } catch (e) {
            // printed message
            // GiConsoleController.err
        }
    }

    const getCasinoGames = () => {
        if (dgaConnected) {
            window.dga.available('ppcdk00000010157')
        }
    }

    const getGamesForTableKeys = () => {
        Object.values(tableKeys).forEach((data, key) => {
            window.dga.subscribe('ppcdk00000010157', data?.id, 'Ksh')
        })
    }

    useEffect(() => {
        initializeDGA().then(() => {
            initializeDGAEvents()
        })
        //fetchGames()
    }, [])

    useEffect(() => {
        getCasinoGames()
    }, [dgaConnected])

    useEffect(() => {
        getGamesForTableKeys()
    }, [tableKeys])

    useEffect(() => {
    }, [tableData])


    return (
        <>
            <h1>Casino</h1>
        </>
    )

}


export default LiveCasino;

