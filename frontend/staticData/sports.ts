import { AiFillBook, AiOutlineStar } from "react-icons/ai";
import { BiFootball } from "react-icons/bi";
import { FaTableTennis, FaVoteYea } from "react-icons/fa";
import { GiCardPlay, GiGamepadCross, GiHorseHead, GiSittingDog } from "react-icons/gi";
import { MdCasino } from "react-icons/md";
import { TbCricket } from "react-icons/tb";
const sports = [
  // {
  //   label: "favourites",
  //   icon: AiOutlineStar,
  //   img: "https://www.lotus365.com/static/media/sideBarStar.8347cb3e.svg",
  //   link: "/favourites",
  // },
  // {
  //   label: "election",
  //   icon: FaVoteYea,
  //   img: "https://www.lotus365.com/static/media/election-icon.1be45f54.svg",
  //   link: "/election"
  // },
  {
    label: "cricket",
    icon: TbCricket,
    img: "https://www.lotus365.com/static/media/sideBarCricket.db454117.svg",
    link: "/sportsbook?group=Cricket"
  },
  {
    label: "football",
    icon: BiFootball,
    img: "https://www.lotus365.com/static/media/sideBarFooltball.724705a5.svg",
    link: "/sportsbook/?group=Soccer"
  },
  {
    label: "tennis",
    icon: FaTableTennis,
    img: "https://www.lotus365.com/static/media/sideBarTennis.268c4683.svg",
    link: "/sportsbook/?group=Tennis"
  },
  // {
  //   label: "horse racing",
  //   icon: GiHorseHead,
  //   img: "https://www.lotus365.com/static/media/sideBarHorse.6c8a9ff3.svg",
  //   link: "/horse-racing"
  // },
  // {
  //   label: "greyhound racing",
  //   icon: GiSittingDog,
  //   img: "https://www.lotus365.com/static/media/sideBarExchange.e279c1d0.svg",
  //   link: "/greyhound-racing"
  // },
  {
    label: "indian card games",
    icon: GiCardPlay,
    img: "https://www.lotus365.com/static/media/sideBarFooltball.724705a5.svg",
    link: "/indian-card-games"
  },
  {
    label: "sportsbook",
    icon: AiFillBook,
    img: "https://www.lotus365.com/static/media/sportsbook-icon.8a583066.svg",
    link: "/sportsbook"
  },
  {
    label: "live casino",
    icon: MdCasino,
    img: "https://www.lotus365.com/static/media/sideBarLivecasino.ddfa583c.svg",
    link: "/live-casino"
  },
  {
    label: "slots games",
    icon: GiGamepadCross,
    img: "https://www.lotus365.com/static/media/sideBarSlotsgames.d6cdb627.svg",
    link: "/slots-games"
  },
];

export default sports;
