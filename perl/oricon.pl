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

my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( weeks => 2);
my $ld_ymd = $ld->ymd();

my $rank = 1;
my $count = 1;

print "[";

for (my $i = 1; $i <= 5; $i++) {
	my $url = "http://www.oricon.co.jp/rank/js/w/$ld_ymd/p/$i/";
	my $html = get("$url");
	my $dom = Mojo::DOM->new($html);

	for my $div ($dom->find('section[class*="box-rank-entry"]')->each) {
		my $title_norm;
		if ($div->find('h2[class="title"]')->first) {
			my $title = $div->find('h2[class="title"]')->first->text;
			$title_norm = normalize_title($title);
		}
		my $artist_norm;
		if ($div->find('p[class="name"]')->first) {
			my $artist = $div->find('p[class="name"]')->first->text;
			$artist_norm = normalize_artist($artist);
		}
		my @tokens = split(/\//, $title_norm);
		foreach my $title_token (@tokens) {
			my $token_norm = normalize_title($title_token);
			print ",\n" if $count > 1;
			print "{ \"rank\": $rank, \"song\": \"$token_norm\", \"artist\": \"$artist_norm\" }";
			$count++;
		}
		$rank++;
	}
}

print "]";

sub normalize_title($)
{
	my $string = shift;

	if ($string =~ /^Stay with me$/) { return $string; }
	
	$string =~ s/\(.*\)//g;
	$string =~ s/\s+$//g;
	$string =~ s/^\s+$//g;
	$string =~ s/[\'’]/`/g;
	$string =~ s/\sfeat\..*$//;
	$string =~ s/\swith\s.*$//;
	$string =~ s/\\/¥/g;
	$string =~ s/-.*-//g;
	
	if ($string =~ /^Like a Cat$/) { return "사뿐사뿐"; }
	if ($string =~ /^胸キュン$/) { return "심쿵해"; }
	if ($string =~ /^Mr.Chu$/) { return "Mr. Chu (On Stage)"; }
	if ($string =~ /^戦姫絶唱シンフォギアGX キャラクターソング1$/) { return "星天ギャラクシィクロス"; }
	if ($string =~ /^戦姫絶唱シンフォギアGX キャラクターソング6$/) { return "ジェノサイドソウ·ヘヴン"; }
	if ($string =~ /^SUMMER SPECIAL Pinocchio$/) { return "피노키오"; }
	if ($string =~ /^My Instant Song E.P.$/) { return "My Instant Song"; }
	if ($string =~ /^うたの☆プリンスさまっ♪マジLOVEレボリューションズ アイドルソング 寿嶺二$/) { return "Never..."; }
	if ($string =~ /^うたの☆プリンスさまっ♪マジLOVEレボリューションズ アイドルソング 黒崎蘭丸$/) { return "Only One"; }
	if ($string =~ /^うたの☆プリンスさまっ♪マジLOVEレボリューションズ アイドルソング カミュ$/) { return "Saintly Territory"; }
	if ($string =~ /^うたの☆プリンスさまっ♪マジLOVEレボリューションズ クロスユニットアイドルソング 神宮寺レン・来栖翔・愛島セシル$/) { return "Code: T.V.U"; }
	if ($string =~ /^fightinggirls$/) { return "fighting-Φ-girls"; }

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^f\(x\)/) { return "f(x)"; }
	if ($string =~ /^Fear,and Loathing in Las Vegas$/) { return "Fear, and Loathing in Las Vegas"; }
	if ($string =~ /^コトリ with ステッチバード$/) { return $string; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\/.*$//;
	$string =~ s/\sfeat\..*$//;
	$string =~ s/\swith\s.*$//;
	$string =~ s/\svs\s.*$//;
	$string =~ s/\s+$//;
	$string =~ s/[\'’]/`/g;
	
	if ($string =~ /^マリア×風鳴翼$/) { return "日笠陽子"; }
	if ($string =~ /^Block B$/) { return "블락비"; }
	if ($string =~ /^KARA$/) { return "카라"; }
	if ($string =~ /^WOOYOUNG$/) { return "우영"; }
	if ($string =~ /^東方神起$/) { return "동방신기"; }
	if ($string =~ /^防弾少年団$/) { return "방탄소년단"; }
	if ($string =~ /^SHINee$/) { return "샤이니"; }
	if ($string =~ /^神宮寺レン・来栖翔・愛島セシル$/) { return "神宮寺レン"; }
	if ($string =~ /^Printemps〜高坂穂乃果$/) { return "Printemps"; }
	if ($string =~ /^lily white〜園田海未$/) { return "lily white"; }
	if ($string =~ /^BiBi〜絢瀬絵里$/) { return "BiBi"; }
	if ($string =~ /^EXILE ATSUSHI \+ AI$/) { return "EXILE ATSUSHI"; }

	return $string;
}
