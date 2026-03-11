import React, { useContext, useState } from 'react';
import CasinoCarousel from '../../carousel/casino-carousel';
import { ShimmerTable } from 'react-shimmer-effects';
import NoEvents from '../../utils/no-events';
import CategoryListing from './category-listing';
import { Context } from '../../../context/store';

import { IoGameController } from "react-icons/io5";
import { FaHotjar, FaGamepad } from "react-icons/fa";
import { RiLiveFill } from "react-icons/ri";
import { SiNintendogamecube } from "react-icons/si";
import { HiGiftTop } from "react-icons/hi2";
import { BiSolidOffer } from "react-icons/bi";

const CasinoHomes = () => {
    const { games, fetching } = useContext(Context);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const filteredGames = games?.filter((game) =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex">
            <main className="flex-grow ant-layout-content p-6 bg-gray-100">
                {/* Carousel Section */}
                <CasinoCarousel />

               {/* Tabs for Sections */}
                <div className="tabs-container mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 p-2 rounded-lg shadow-md">
                    <button
                        onClick={() => scrollToSection('must-play-section')}
                        className="tab-button bg-pink-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-600 hover:text-white"
                    >
                        <IoGameController />
                        Must Play
                    </button>
                    <button
                        onClick={() => scrollToSection('new-games-section')}
                        className="tab-button bg-blue-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white"
                    >
                        <FaHotjar />
                        New Games
                    </button>
                    <button
                        onClick={() => scrollToSection('live-section')}
                        className="tab-button bg-purple-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 hover:text-white"
                    >
                        <RiLiveFill />
                        Live
                    </button>
                    <button
                        onClick={() => scrollToSection('tables-section')}
                        className="tab-button bg-orange-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-600 hover:text-white"
                    >
                        <SiNintendogamecube />
                        Tables
                    </button>
                    <button
                        onClick={() => scrollToSection('drops-wins-section')}
                        className="tab-button bg-cyan-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-600 hover:text-white"
                    >
                        <HiGiftTop />
                        Drops & Wins
                    </button>
                    <button
                        onClick={() => scrollToSection('daily-offers-section')}
                        className="tab-button bg-green-200 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white"
                    >
                        <BiSolidOffer />
                        Daily Offers
                    </button>
                </div>

                {/* Section for each tab with cards */}
                <div className="casino-section mt-6">
                    {['must-play', 'new-games', 'live', 'tables', 'drops-wins', 'daily-offers'].map((section, idx) => (
                        <div id={`${section}-section`} key={idx} className="section mb-8">
                            <h2 className="section-title text-2xl font-bold mb-4 capitalize">
                                {section.replace('-', ' ')}
                            </h2>
                            {/* Responsive Cards Container */}
                            <div className="cards-container grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="card-item bg-white shadow-lg rounded-lg p-4">
                                    <img
                                        src={require(`../../../assets/img/casino/icons/casinohome.avif`)}
                                        alt="Card Item"
                                        className="card-image object-cover w-full h-48 sm:h-60 rounded-lg"
                                    />
                                    <p className="card-description mt-2 text-center">Game</p>
                                </div>
                                <div className="card-item bg-white shadow-lg rounded-lg p-4">
                                    <img
                                        src={require(`../../../assets/img/casino/icons/aviatrixhome.avif`)}
                                        alt="Card Item"
                                        className="card-image object-cover w-full h-48 sm:h-60 rounded-lg"
                                    />
                                    <p className="card-description mt-2 text-center">Game</p>
                                </div>
                                <div className="card-item bg-white shadow-lg rounded-lg p-4">
                                    <img
                                        src={require(`../../../assets/img/casino/icons/spinhome.avif`)}
                                        alt="Card Item"
                                        className="card-image object-cover w-full h-48 sm:h-60 rounded-lg"
                                    />
                                    <p className="card-description mt-2 text-center">Game</p>
                                </div>
                                <div className="card-item bg-white shadow-lg rounded-lg p-4">
                                    <img
                                        src={require(`../../../assets/img/casino/icons/aviatorhome.avif`)} // New image added here
                                        alt="Card Item"
                                        className="card-image object-cover w-full h-48 sm:h-60 rounded-lg"
                                    />
                                    <p className="card-description mt-2 text-center">Game</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Games Listing Section */}
                <div className="casino-games-list mt-6">
                    {fetching ? (
                        <ShimmerTable row={3} />
                    ) : filteredGames?.length < 1 ? (
                        <NoEvents message="Casino Games not found" />
                    ) : (
                        filteredGames?.map((category, idx) => (
                            <CategoryListing key={idx} games={category?.gameList} gamestype={category?.game_type} />
                        ))
                    )}
                </div>

                {/* "More Games" Button */}
                <div className="flex justify-center mt-8">
                   <button 
                        type="button" 
                        className="casino-more-games-btn border border-blue-500 min-w-[100px] rounded-lg bg-blue-100 hover:bg-red-100 hover:border-2 hover:border-custom-red flex items-center justify-center gap-2 px-4 py-2 transition-colors"
                    >
                        <span className="ant-btn-icon">
                            <FaGamepad size={24} />
                        </span>
                        <span>More Games</span>
                    </button>
                </div>
                
            </main>
        </div>
    );
};

export default CasinoHomes;
