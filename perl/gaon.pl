use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];

my $date = DateTime->new( year => $yy, month => $mm, day => $dd )
									 ->add( weeks => 1)
									 ->add( days => 1);

my $jan2 = DateTime->new( year => $yy, month => 1, day => 2)->week_number();
my $jan4 = DateTime->new( year => $yy, month => 1, day => 4)->week_number();

$date = $date->add( weeks => 1) if ($jan2 != $jan4);

my $year = $date->week_year();
my $week = $date->week_number();
my $week_string = sprintf("%02d", $week);

my $url = "http://www.gaonchart.co.kr/main/section/chart/online.gaon?nationGbn=T&serviceGbn=ALL&targetTime=$week_string&hitYear=$year&termGbn=week";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('td[class*="subject"]')->each) {
	my $title = $div->find('p')->first->text;
	my $artist = $div->find('p[class~="singer"]')->first->attr('title');
	my $title_norm = normalize_title($title);
	my $artist_norm = normalize_artist($artist);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	
	if ($string =~ /^Mr. Chu/) { return "Mr. Chu (On Stage)"; }
	if ($string =~ /^살자 \(The Cure\)/) { return "살자 (The Cure)"; }
	if ($string =~ /^그게나야/) { return "그게 나야"; }

	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^에이핑크/) { return "Apink"; }
	if ($string =~ /^비원에이포/) { return "B1A4"; }
	if ($string =~ /^크러쉬/) { return "Crush"; }
	if ($string =~ /^f\(x\)/) { return "f(x)"; }
	if ($string =~ /^G-Dragon/) { return "GD"; }
	if ($string =~ /^MC몽/) { return "MC 몽"; }
	if ($string =~ /^레드벨벳/) { return "Red Velvet"; }
	if ($string =~ /^산이/) { return "San E"; }
	if ($string =~ /^스윙스/) { return "Swings"; }
	if ($string =~ /^T.O.P/) { return "TOP"; }
	if ($string =~ /^유브이/) { return "UV"; }
	if ($string =~ /^위너/) { return "WINNER"; }
	if ($string =~ /^자이언티/) { return "Zion.T"; }
	if ($string =~ /^마이티마우스/) { return "마이티 마우스"; }
	if ($string =~ /^브라운아이드걸스/) { return "브라운 아이드 걸스"; }
	if ($string =~ /^슈퍼주니어 예성/) { return "예성"; }
	if ($string =~ /^오렌지캬라멜/) { return "오렌지 캬라멜"; }
	if ($string =~ /^울랄라세션/) { return "울랄라 세션"; }
	if ($string =~ /^존 박/) { return "존박"; }
	if ($string =~ /^소녀시대-태티서/) { return "태티서"; }
	if ($string =~ /^15&/) { return "15&"; }
	if ($string =~ /^포미닛/) { return "4minute"; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\s+$//;
	
	if ($string =~ /^바비$/) { return "BOBBY"; }
	if ($string =~ /^브로$/) { return "Bro"; }
	if ($string =~ /^Gary$/) { return "개리"; }
	if ($string =~ /^XIA$/) { return "김준수"; }

	return $string;
}
