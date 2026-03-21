import HomeIcon from "../../assets/images/colorsvgicons/home.svg";
import LiveIcon from "../../assets/images/colorsvgicons/livescore.svg";
import JackpotIcon from "../../assets/images/colorsvgicons/jackpot.svg";
import AviatorIcon from "../../assets/images/colorsvgicons/aviator.svg";
import MundialIcon from "../../assets/images/colorsvgicons/mundial-league.svg";
import DefaultIcon from "../../assets/images/colorsvgicons/soccer.svg";

export const icons: Record<string, any> = {
    home: HomeIcon,
    livescore: LiveIcon,
    jackpot: JackpotIcon,
    aviator: AviatorIcon,
    "mundial-league": MundialIcon,
};

export const NavIcon = (name: string) => {
    const cleanName = name.replace(".svg", "");
    return icons[cleanName] || DefaultIcon;
};