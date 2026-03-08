import React, { useState, useCallback, useContext, useEffect } from "react";
import makeRequest from "../utils/fetch-request";
import { Context } from "../../context/store";
import Notify from "../utils/Notify";
import { Link } from "react-router-dom";
import { GiSoccerBall } from "react-icons/gi";
import AdvertImg from "../../assets/highlight/advert2.PNG"

const Advert2 = (props) => {

    return (
        <>
            <div>
                <Link to={"/aviator"} className="highlights">
                    <div className="marquee-card free-bet">
                        {/* <div className="card-top-sub-heading">
                                <div className="row">
                                    <div className="col-8">
                                       <GiSoccerBall className="inline-block text-3xl mr-2"/><span className="">betmundial Free Bets</span> 
                                    </div>
                                    <div className="col-4" style={{fontSize:"11px", fontWeight:"500"}}>
                                        <div className="uppercase"><span className="type">Pre</span> 2H 30:20</div>
                                    </div>
                                </div>
                            </div> */}
                        <div className="main image-main">
                            <img src={AdvertImg} alt="" className="highlights-content-img w-full" />
                        </div>

                        <div className="bet-highlight">
                            <div className="market-type ng-star-inserted">
                                <span className="line-span"></span>
                                <span className="market-name-span font-[500] text-black" title="Total Goals"> Featured Today</span>
                                <span className="line-span"></span>
                            </div>
                        </div>

                        <div className="">
                            <div className="ng-star-inserted">
                                <span className="card-option-group featured-title text-center">
                                    Mike Tyson <span className="mx-2"> Vs </span> Paul Jakes
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </>
    )
}


export default React.memo(Advert2);