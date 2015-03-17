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
								 ->add( weeks => 2)
								 ->add( days => 5 );
my $ld_ymd = $ld->ymd();

my $url = "http://www.billboard.com/charts/hot-100/$ld_ymd";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="row-title"]')->each) {
	my $title_norm;
	if ($div->find('h2')->first) {
		my $title = $div->find('h2')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('a')->first) {
		my $artist_url = $div->find('a')->first->attr('href');
		my $artist = get_artist_from_url($artist_url);
		$artist_norm = normalize_artist($artist);
	} elsif ($div->find('h3')->first) {
		my $artist = $div->find('h3')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub get_artist_from_url($)
{
	my $artist = shift;

	$artist =~ s/^.*\///;
	$artist =~ s/-/ /g;

	return $artist;
}

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	
	if ($string =~ /^Gangnam Style$/) { return "강남스타일"; }

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\s+$//;

	if ($string =~ /^psy$/) { return "싸이"; }
	if ($string =~ /^bob$/) { return "B.o.B"; }
	if ($string =~ /^disclosure$/) { return "The Disclosure"; }
	if ($string =~ /^lumineers$/) { return "The Lumineers"; }
	if ($string =~ /^magic$/) { return "MAGIC!"; }
	if ($string =~ /^macklemore ryan lewis$/) { return "Macklemore"; }
	if ($string =~ /^nico vinz$/) { return "Nico & Vinz"; }
	if ($string =~ /^pnk$/) { return "P!nk"; }
	if ($string =~ /^ti$/) { return "T.I."; }
	if ($string =~ /^weeknd$/) { return "The Weeknd"; }
	if ($string =~ /^william$/) { return "Will.I.Am"; }
	
	return $string;
}
