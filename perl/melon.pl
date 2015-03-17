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

my $url = get_url();
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="wrap_song_info"]')->each) {
	my $title_norm;
	if ($div->find('div[class~="rank01"]')->first->find('a')->first) {
		my $title = $div->find('div[class~="rank01"]')->first->find('a')->first->text;
		$title_norm = normalize_title($title);
	} else {
		my $title = $div->find('span[class~="fc_lgray"]')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('div[class~="rank02"]')->first->find('a')->first) {
		my $artist = $div->find('div[class~="rank02"]')->first->find('a')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub first_day_of_week_old
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->subtract( days => 1);
}

sub last_day_of_week_old
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->add( days => 5 );
}

sub first_day_of_week_new
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' );
}

sub last_day_of_week_new
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->add( days => 6 );
}

sub get_url
{
	my $age = int($yy / 10) * 10;
	my $fd, $ld;

	if ($yy < 2012 ||
		 ($yy == 2012 && ($mm < 8 || ($mm == 8 && $dd <= 19)))) {
		$fd = first_day_of_week_old();
		$ld = last_day_of_week_old();
	} else {
		$fd = first_day_of_week_new();
		$ld = last_day_of_week_new();
	}

	my $fd_ymd = $fd->ymd('');
	my $ld_ymd = $ld->ymd('');
	my $url = sprintf("http://www.melon.com/chart/search/list.htm?chartType=WE&age=%d&year=%d&mon=%02d&day=%d%%5E%d&classCd=DP0000&startDay=%d&endDay=%d&moved=Y", $age, $year, $ld->month(), $fd_ymd, $ld_ymd, $fd_ymd, $ld_ymd);

	print "$fd_ymd\n";
	print "$ld_ymd\n";
	print "$url\n";

	return $url;
}

sub normalize_title($)
{
	my $string = shift;
	
	if ($string =~ /^Mr. Chu/) { return "Mr. Chu (On Stage)"; }
	if ($string =~ /^살자 \(The Cure\)/) { return "살자 (The Cure)"; }
	if ($string =~ /^죽을만큼 아파서 Part.2/) { return "죽을만큼 아파서 Part 2"; }
	if ($string =~ /^나의 옛날이야기/) { return "나의 옛날 이야기"; }
	if ($string =~ /^삐에로는 우릴 보고 웃지 \(김완선\)/) { return "삐에로는 우릴 보고 웃지"; }
	if ($string =~ /^삐에로는 우릴 보고 웃지/) { return "삐에로는 우릴보고 웃지"; }
	if ($string =~ /^슈퍼잡초맨/) { return "슈퍼 잡초맨"; }
	if ($string =~ /^YooHoo/) { return "Yoo Hoo"; }
	if ($string =~ /^외로움증폭장치/) { return "외로움 증폭장치"; }
	if ($string =~ /^Hotshot/) { return "Hot Shot"; }
	if ($string =~ /^꽃피는 봄이오면/) { return "꽃피는 봄이 오면"; }
	if ($string =~ /^울고, 불고/) { return "울고, 불고"; }
	if ($string =~ /^Lollipop Pt.2/) { return "Lollipop Part 2"; }

	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^더블 케이/) { return "Double K"; }
	if ($string =~ /^f\(x\)/) { return "f(x)"; }
	if ($string =~ /^지드래곤/) { return "GD"; }
	if ($string =~ /^미쓰에이/) { return "miss A"; }
	if ($string =~ /^SIMON Dominic/) { return "Simon D"; }
	if ($string =~ /^스윙스/) { return "Swings"; }
	if ($string =~ /^T.O.P/) { return "TOP"; }
	if ($string =~ /^양동근/) { return "YDG"; }
	if ($string =~ /^매드클라운/) { return "매드 클라운"; }
	if ($string =~ /^브라운아이드걸스/) { return "브라운 아이드 걸스"; }
	if ($string =~ /^Beenzino/) { return "빈지노"; }
	if ($string =~ /^Supreme Team/) { return "슈프림팀"; }
	if ($string =~ /^CNBLUE/) { return "씨엔블루"; }
	if ($string =~ /^에픽 하이/) { return "에픽하이"; }
	if ($string =~ /^어반자카파/) { return "어반 자카파"; }
	if ($string =~ /^엠씨 더 맥스/) { return "엠씨더맥스"; }
	if ($string =~ /^울랄라세션/) { return "울랄라 세션"; }
	if ($string =~ /^t 윤미래/) { return "윤미래"; }
	if ($string =~ /^윤미래/) { return "윤미래"; }
	if ($string =~ /^JOO/) { return "주"; }
	if ($string =~ /^JUNIEL/) { return "주니엘"; }
	if ($string =~ /^소녀시대-태티서/) { return "태티서"; }
	if ($string =~ /^틴탑/) { return "틴 탑"; }
	if ($string =~ /^15&/) { return "15&"; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\s+$//;
	
	if ($string =~ /^미$/) { return "美"; }
	if ($string =~ /^XIA$/) { return "김준수"; }

	return $string;
}
