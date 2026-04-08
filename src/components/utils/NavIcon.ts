import HomeIcon from "../../assets/images/colorsvgicons/home.svg";
import LiveIcon from "../../assets/images/colorsvgicons/livescore.svg";
import JackpotIcon from "../../assets/images/colorsvgicons/jackpot.svg";
import AviatorIcon from "../../assets/images/colorsvgicons/aviator.svg";
import MundialIcon from "../../assets/images/colorsvgicons/mundial-league.svg";
import DefaultIcon from "../../assets/images/colorsvgicons/soccer.svg";
import SoccerIcon from "../../assets/images/colorsvgicons/soccer.svg";
import BasketBallIcon from "../../assets/images/colorsvgicons/basketball.svg";
import BaseballIcon from "../../assets/images/colorsvgicons/baseball.svg";
import VolleyBallIcon from "../../assets/images/colorsvgicons/volleyball.svg";
import TennisIcon from "../../assets/images/colorsvgicons/tennis.svg";
import HandballIcon from "../../assets/images/colorsvgicons/handball.svg";
import BoxingIcon from "../../assets/images/colorsvgicons/boxing.svg";
import CricketIcon from "../../assets/images/colorsvgicons/cricket.svg";
import DartsIcon from "../../assets/images/colorsvgicons/darts.svg";
import BadmintonIcon from "../../assets/images/colorsvgicons/badminton.svg";
import TableTennisIcon from "../../assets/images/colorsvgicons/table tennis.svg";
import RugbyIcon from "../../assets/images/colorsvgicons/rugby.svg";
import SquashIcon from "../../assets/images/colorsvgicons/squash.svg";
import FieldHockeyIcon from "../../assets/images/colorsvgicons/field hockey.svg";
import IceHockeyIcon from "../../assets/images/colorsvgicons/ice hockey.svg";
import BowlsIcon from "../../assets/images/colorsvgicons/bowls.svg";
import FutsalIcon from "../../assets/images/colorsvgicons/futsal.svg";
import Dota2Icon from "../../assets/images/colorsvgicons/dota 2.svg";
import BeachVolleyIcon from "../../assets/images/colorsvgicons/beach volley.svg";
import CounterStrikeIcon from "../../assets/images/colorsvgicons/counter-strike.svg";
import LeagueOfLegendsIcon from "../../assets/images/colorsvgicons/league of legends.svg";
import AmericanFootballIcon from "../../assets/images/colorsvgicons/american football.svg";
import AussieRulesIcon from "../../assets/images/colorsvgicons/aussie rules.svg";
import SnookerIcon from "../../assets/images/colorsvgicons/snooker.svg";
import FloorBallIcon from "../../assets/images/colorsvgicons/floorball.svg";
import BeachSoccerIcon from "../../assets/images/colorsvgicons/beach soccer.svg";
import WaterpoloIcon from "../../assets/images/colorsvgicons/waterpolo.svg";
import SpeedwayIcon from "../../assets/images/colorsvgicons/speedway.svg";
import PesapalloIcon from "../../assets/images/colorsvgicons/pesapallo.svg";
import MMAIcon from "../../assets/images/colorsvgicons/mma.svg";
import ESportCounterStrike from "../../assets/images/colorsvgicons/esport counter-strike.svg";
import ESoccerIcon from "../../assets/images/colorsvgicons/esoccer.svg";
import KabaddiIcon from "../../assets/images/colorsvgicons/kabaddi.svg";
import Basketball3X3Icon from "../../assets/images/colorsvgicons/basketball 3x3.svg";
import StarCraftIcon from "../../assets/images/colorsvgicons/starcraft.svg";
import CurlingIcon from "../../assets/images/colorsvgicons/curling.svg";
import StockCarRacingIcon from "../../assets/images/colorsvgicons/stock car racing.svg";
import CyclingIcon from "../../assets/images/colorsvgicons/cycling.svg";
import BiathlonIcon from "../../assets/images/colorsvgicons/biathlon.svg";
import RallyIcon from "../../assets/images/colorsvgicons/rally.svg";
import BandyIcon from "../../assets/images/colorsvgicons/bandy.svg";
import GaelicFootballIcon from "../../assets/images/colorsvgicons/gaelic football.svg";
import GaelicHurlingIcon from "../../assets/images/colorsvgicons/gaelic hurling.svg";
import AviatrixIcon from "../../assets/images/casino/icons/Aviatrix.svg";
import JetXIcon from "../../assets/images/casino/icons/JetX.svg";

export const icons: Record<string, any> = {
    home: HomeIcon,
    livescore: LiveIcon,
    jackpot: JackpotIcon,
    aviator: AviatorIcon,
    soccer: SoccerIcon,
    basketball: BasketBallIcon,
    baseball: BaseballIcon,
    volleyball: VolleyBallIcon,
    tennis: TennisIcon,
    handball: HandballIcon,
    boxing: BoxingIcon,
    cricket: CricketIcon,
    darts: DartsIcon,
    badminton: BadmintonIcon,
    "mundial-league": MundialIcon,
    futsal: FutsalIcon,
    "dota 2": Dota2Icon,
    "beach volley": BeachVolleyIcon,
    "counter-strike": CounterStrikeIcon,
    "league of legends": LeagueOfLegendsIcon,
    "american football": AmericanFootballIcon,
    "aussie rules": AussieRulesIcon,
    snooker: SnookerIcon,
    floorball: FloorBallIcon,
    "beach soccer": BeachSoccerIcon,
    "table tennis": TableTennisIcon,
    rugby: RugbyIcon,
    squash: SquashIcon,
    bowls: BowlsIcon,
    "field hockey": FieldHockeyIcon,
    "ice hockey": IceHockeyIcon,
    waterpolo: WaterpoloIcon,
    speedway: SpeedwayIcon,
    pesapallo: PesapalloIcon,
    mma: MMAIcon,
    "esport counter-strike": ESportCounterStrike,
    esoccer: ESoccerIcon,
    kabaddi: KabaddiIcon,
    "basketball 3x3": Basketball3X3Icon,
    starcraft: StarCraftIcon,
    curling: CurlingIcon,
    "stock car racing": StockCarRacingIcon,
    cycling: CyclingIcon,
    biathlon: BiathlonIcon,
    rally: RallyIcon,
    bandy: BandyIcon,
    "gaelic football": GaelicFootballIcon,
    "gaelic hurling": GaelicHurlingIcon,
    aviatrix: AviatrixIcon,
    jetx: JetXIcon,

};

export const NavIcon = (name: string) => {
    const cleanName = name.replace(".svg", "");
    return icons[cleanName] || DefaultIcon;
};
