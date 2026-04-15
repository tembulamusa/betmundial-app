import DefaultCasinoIcon from "../../assets/images/casino/icons/default.svg";
import AllCasinoIcon from "../../assets/images/casino/icons/home.svg";
import PopularCasinoIcon from "../../assets/images/casino/icons/popular.svg";
import CrashCasinoIcon from "../../assets/images/casino/icons/Crash.svg";
import SlotsCasinoIcon from "../../assets/images/casino/icons/Slots.svg";
import RouletteCasinoIcon from "../../assets/images/casino/icons/Roulette.svg";
import KenoCasinoIcon from "../../assets/images/casino/icons/Keno.svg";
import VideoGamesCasinoIcon from "../../assets/images/casino/icons/Video Slots.svg";
import PragmaticIcon from "../../assets/images/casino/icons/pragmatic.svg";
import KagamingIcon from "../../assets/images/casino/icons/kagaming.svg";
import Oaks3Icon from "../../assets/images/casino/icons/3 oaks.svg";
import SplitThePotIcon from "../../assets/images/casino/icons/splitthepot.svg";
import SpribeIcon from "../../assets/images/casino/icons/spribe.svg";
import JetXIcon from "../../assets/images/casino/icons/JetX.svg";


export const casinoIcons: Record<string, any> = {
    all: AllCasinoIcon,
    home: AllCasinoIcon,
    popular: PopularCasinoIcon,
    crash: CrashCasinoIcon,
    slots: SlotsCasinoIcon,
    roulette: RouletteCasinoIcon,
    keno: KenoCasinoIcon,
    "video games": VideoGamesCasinoIcon,
    "video slots": VideoGamesCasinoIcon,
    pragmatic: PragmaticIcon,
    kagaming: KagamingIcon,
    "3 oaks": Oaks3Icon,
    "three oaks": Oaks3Icon,
    splitthepot: SplitThePotIcon,
    "split the pot": SplitThePotIcon,
    spribe: SpribeIcon,
    jetx: JetXIcon,
};

export const CasinoIcon = (name: string) => {
    const cleanName = name.toLowerCase().replace(".svg", "").trim();
    return casinoIcons[cleanName] || DefaultCasinoIcon;
};
